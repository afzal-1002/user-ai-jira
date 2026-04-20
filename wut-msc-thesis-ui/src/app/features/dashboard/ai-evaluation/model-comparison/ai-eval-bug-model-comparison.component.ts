import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { Chart, ChartConfiguration, Plugin } from 'chart.js';
import { take } from 'rxjs';
import { AiEstimationsService } from '../../../../services/ai/ai-estimations.service';

interface ConfidenceInterval {
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
}

interface ModelComparisonEntry {
  aiProvider: string;
  aiModel: string;
  avgAnalysisTimeSec: number;
  minAnalysisTimeSec: number;
  maxAnalysisTimeSec: number;
  stdDeviationAnalysisTime: number;
  avgEstimatedResolutionHours: number;
  minEstimatedResolutionHours: number;
  maxEstimatedResolutionHours: number;
  avgActualResolutionHours: number;
  markdownEnabled: boolean;
  explanationEnabled: boolean;
  stabilityScore: number;
  confidenceInterval: ConfidenceInterval | null;
}

interface IssueModelComparisonResponse {
  issueKey: string;
  modelComparison: ModelComparisonEntry[];
}

interface SummaryChip {
  label: string;
  value: string;
  tone: 'teal' | 'amber' | 'indigo' | 'slate' | 'rose';
}

interface ConfidenceIntervalBounds {
  min: number;
  max: number;
}

type LabeledBarDataset = ChartConfiguration<'bar'>['data']['datasets'][number] & {
  showValueLabel?: boolean;
};

const bugConfidenceIntervalPlugin: Plugin<'bar'> = {
  id: 'bug-confidence-interval',
  afterDatasetsDraw: chart => {
    const ctx = chart.ctx;
    const yScale = chart.scales['y'];
    if (!ctx || !yScale) {
      return;
    }

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const ciBounds: ConfidenceIntervalBounds[] | undefined = dataset?.ciBounds;
      if (!ciBounds?.length) {
        return;
      }

      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((element: any, index: number) => {
        const bounds = ciBounds[index];
        if (!bounds) {
          return;
        }

        const x = element.x as number;
        const upper = yScale.getPixelForValue(bounds.max);
        const lower = yScale.getPixelForValue(bounds.min);

        ctx.save();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x, upper);
        ctx.lineTo(x, lower);
        ctx.stroke();

        const capWidth = 10;
        ctx.beginPath();
        ctx.moveTo(x - capWidth / 2, upper);
        ctx.lineTo(x + capWidth / 2, upper);
        ctx.moveTo(x - capWidth / 2, lower);
        ctx.lineTo(x + capWidth / 2, lower);
        ctx.stroke();
        ctx.restore();
      });
    });
  }
};

const bugBarValueLabelPlugin: Plugin<'bar'> = {
  id: 'bug-bar-value-label',
  afterDatasetsDraw: chart => {
    const ctx = chart.ctx;
    if (!ctx) {
      return;
    }

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      if (!dataset?.showValueLabel) {
        return;
      }

      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta?.hidden) {
        return;
      }

      meta.data.forEach((element: any, index: number) => {
        const value = typeof dataset.data?.[index] === 'number' ? dataset.data[index] : null;
        if (value === null || !Number.isFinite(value)) {
          return;
        }

        const position = element.tooltipPosition ? element.tooltipPosition() : { x: element.x, y: element.y };
        ctx.save();
        ctx.font = '600 12px "Space Grotesk", "DM Sans", sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(value.toFixed(2), position.x, position.y - 6);
        ctx.restore();
      });
    });
  }
};

if (typeof window !== 'undefined') {
  Chart.register(bugConfidenceIntervalPlugin, bugBarValueLabelPlugin);
}

@Component({
  selector: 'app-ai-eval-bug-model-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './ai-eval-bug-model-comparison.component.html',
  styleUrls: ['./ai-eval-bug-model-comparison.component.css']
})
export class AiEvalBugModelComparisonComponent {
  issueKeyInput = '';
  isLoading = false;
  errorMessage: string | null = null;
  hasAttempted = false;
  result: IssueModelComparisonResponse | null = null;
  summaryChips: SummaryChip[] = [];
  resolutionHoursChartData: ChartConfiguration<'bar'>['data'] | null = null;
  resolutionHoursChartOptions: ChartConfiguration<'bar'>['options'] | null = null;
  analysisTimeChartData: ChartConfiguration<'bar'>['data'] | null = null;
  analysisTimeChartOptions: ChartConfiguration<'bar'>['options'] | null = null;
  stabilityConfidenceChartData: ChartConfiguration<'bar'>['data'] | null = null;
  stabilityConfidenceChartOptions: ChartConfiguration<'bar'>['options'] | null = null;
  groupedMetricChartData: ChartConfiguration<'bar'>['data'] | null = null;
  groupedMetricChartOptions: ChartConfiguration<'bar'>['options'] | null = null;
  analysisRangeChartData: ChartConfiguration<'bar'>['data'] | null = null;
  analysisRangeChartOptions: ChartConfiguration<'bar'>['options'] | null = null;
  estimationRangeChartData: ChartConfiguration<'bar'>['data'] | null = null;
  estimationRangeChartOptions: ChartConfiguration<'bar'>['options'] | null = null;
  confidenceIntervalChartData: ChartConfiguration<'bar'>['data'] | null = null;
  confidenceIntervalChartOptions: ChartConfiguration<'bar'>['options'] | null = null;
  private readonly chartPalette = ['#2563eb', '#f97316', '#10b981', '#a855f7'];

  constructor(private readonly aiEstimationsService: AiEstimationsService) {}

  handleCompare(): void {
    const normalizedKey = this.issueKeyInput.trim().toUpperCase();
    this.issueKeyInput = normalizedKey;
    this.errorMessage = null;

    if (!normalizedKey) {
      this.result = null;
      this.summaryChips = [];
      this.resetCharts();
      this.hasAttempted = true;
      this.errorMessage = 'Enter a bug key such as BUG-230.';
      return;
    }

    this.isLoading = true;
    this.hasAttempted = true;
    this.result = null;
    this.summaryChips = [];
    this.resetCharts();

    this.aiEstimationsService
      .getModelComparisonByIssue(normalizedKey)
      .pipe(take(1))
      .subscribe({
        next: response => {
          this.result = this.normalizeResponse(response, normalizedKey);
          this.summaryChips = this.buildSummaryChips(this.result.modelComparison);
          this.buildCharts(this.result.modelComparison);
          this.isLoading = false;
        },
        error: err => {
          console.error('Bug-level model comparison failed', err);
          this.errorMessage = err?.error?.message ?? 'Unable to load bug-level comparison for that key.';
          this.result = null;
          this.summaryChips = [];
          this.resetCharts();
          this.isLoading = false;
        }
      });
  }

  formatSeconds(value: number): string {
    if (!Number.isFinite(value)) {
      return '—';
    }
    if (value < 1) {
      return `${value.toFixed(2)} s`;
    }
    return `${value.toFixed(2)} s`;
  }

  formatHours(value: number): string {
    if (!Number.isFinite(value)) {
      return '—';
    }
    return `${value.toFixed(1)} h`;
  }

  formatScore(value: number): string {
    if (!Number.isFinite(value)) {
      return '—';
    }
    return value.toFixed(3);
  }

  formatConfidence(value: number): string {
    if (!Number.isFinite(value)) {
      return '—';
    }
    return `${(value * 100).toFixed(1)}%`;
  }

  trackByProvider(_: number, entry: ModelComparisonEntry): string {
    return `${entry.aiProvider}-${entry.aiModel}`;
  }

  private normalizeResponse(response: any, fallbackIssueKey: string): IssueModelComparisonResponse {
    const rawEntries: any[] = Array.isArray(response?.modelComparison) ? response.modelComparison : [];
    const entries: ModelComparisonEntry[] = rawEntries
      .map(entry => this.normalizeEntry(entry))
      .filter((entry): entry is ModelComparisonEntry => !!entry);

    return {
      issueKey: (response?.issueKey ?? fallbackIssueKey).toString().toUpperCase(),
      modelComparison: entries
    };
  }

  private normalizeEntry(entry: any): ModelComparisonEntry | null {
    if (!entry) {
      return null;
    }

    const aiProvider = (entry.aiProvider ?? '').toString().toUpperCase();
    const aiModel = (entry.aiModel ?? '').toString();
    if (!aiProvider || !aiModel) {
      return null;
    }

    const confidenceInterval: ConfidenceInterval | null = entry.confidenceInterval
      ? {
          lowerBound: this.toNumber(entry.confidenceInterval.lowerBound),
          upperBound: this.toNumber(entry.confidenceInterval.upperBound),
          confidenceLevel: this.toNumber(entry.confidenceInterval.confidenceLevel)
        }
      : null;

    return {
      aiProvider,
      aiModel,
      avgAnalysisTimeSec: this.toNumber(entry.avgAnalysisTimeSec),
      minAnalysisTimeSec: this.toNumber(entry.minAnalysisTimeSec),
      maxAnalysisTimeSec: this.toNumber(entry.maxAnalysisTimeSec),
      stdDeviationAnalysisTime: this.toNumber(entry.stdDeviationAnalysisTime),
      avgEstimatedResolutionHours: this.toNumber(entry.avgEstimatedResolutionHours),
      minEstimatedResolutionHours: this.toNumber(entry.minEstimatedResolutionHours),
      maxEstimatedResolutionHours: this.toNumber(entry.maxEstimatedResolutionHours),
      avgActualResolutionHours: this.toNumber(entry.avgActualResolutionHours),
      markdownEnabled: !!entry.markdownEnabled,
      explanationEnabled: !!entry.explanationEnabled,
      stabilityScore: this.toNumber(entry.stabilityScore),
      confidenceInterval
    };
  }

  private buildSummaryChips(entries: ModelComparisonEntry[]): SummaryChip[] {
    if (!entries.length) {
      return [];
    }

    const chips: SummaryChip[] = [];
    const sortedBySpeed = [...entries].sort((a, b) => a.avgAnalysisTimeSec - b.avgAnalysisTimeSec);
    const fastest = sortedBySpeed[0];
    const slowest = sortedBySpeed[sortedBySpeed.length - 1];

    chips.push({
      label: 'Fastest run',
      value: `${fastest.aiProvider} · ${this.formatSeconds(fastest.avgAnalysisTimeSec)}`,
      tone: 'teal'
    });

    if (slowest !== fastest) {
      const delta = slowest.avgAnalysisTimeSec - fastest.avgAnalysisTimeSec;
      chips.push({
        label: 'Speed delta',
        value: `${delta.toFixed(2)} s gap`,
        tone: 'indigo'
      });
    }

    const mostStable = entries.reduce((best, current) => (current.stabilityScore > best.stabilityScore ? current : best));
    chips.push({
      label: 'Most stable',
      value: `${mostStable.aiProvider} · ${this.formatScore(mostStable.stabilityScore)}`,
      tone: 'amber'
    });

    const avgHoursValues = entries.map(entry => entry.avgEstimatedResolutionHours).filter(value => Number.isFinite(value));
    if (avgHoursValues.length > 1) {
      const spread = Math.max(...avgHoursValues) - Math.min(...avgHoursValues);
      chips.push({
        label: 'Estimation spread',
        value: `${spread.toFixed(1)} h swing`,
        tone: 'rose'
      });
    }

    const markdownReady = entries.filter(entry => entry.markdownEnabled).map(entry => entry.aiProvider);
    chips.push({
      label: 'Markdown ready',
      value: markdownReady.length ? markdownReady.join(' • ') : 'None',
      tone: 'slate'
    });

    return chips;
  }

  private toNumber(value: any): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private buildCharts(entries: ModelComparisonEntry[]): void {
    if (!entries.length) {
      this.resetCharts();
      return;
    }

    const resolutionLabels = ['Min hours', 'Avg hours', 'Max hours'];
    const resolutionDatasets: LabeledBarDataset[] = entries.map((entry, index) => ({
      label: entry.aiProvider,
      data: [
        this.toNumber(entry.minEstimatedResolutionHours),
        this.toNumber(entry.avgEstimatedResolutionHours),
        this.toNumber(entry.maxEstimatedResolutionHours)
      ],
      backgroundColor: this.chartPalette[index % this.chartPalette.length],
      borderRadius: 14,
      maxBarThickness: 38,
      showValueLabel: true
    }));
    this.resolutionHoursChartData = {
      labels: resolutionLabels,
      datasets: resolutionDatasets
    };
    const resolutionValues = entries.flatMap(entry => [
      entry.minEstimatedResolutionHours,
      entry.avgEstimatedResolutionHours,
      entry.maxEstimatedResolutionHours
    ]);
    this.resolutionHoursChartOptions = this.buildBarOptions('h', resolutionValues.map(value => this.toNumber(value)));

    const analysisTimeLabels = ['Avg analysis time (s)', 'Min analysis time (s)', 'Max analysis time (s)'];
    const analysisTimeDatasets: LabeledBarDataset[] = entries.map((entry, index) => ({
      label: entry.aiProvider,
      data: [
        this.toNumber(entry.avgAnalysisTimeSec),
        this.toNumber(entry.minAnalysisTimeSec),
        this.toNumber(entry.maxAnalysisTimeSec)
      ],
      backgroundColor: this.chartPalette[index % this.chartPalette.length],
      borderRadius: 14,
      maxBarThickness: 34,
      showValueLabel: true
    }));
    this.analysisTimeChartData = {
      labels: analysisTimeLabels,
      datasets: analysisTimeDatasets
    };
    const analysisTimeValues = entries.flatMap(entry => [
      this.toNumber(entry.avgAnalysisTimeSec),
      this.toNumber(entry.minAnalysisTimeSec),
      this.toNumber(entry.maxAnalysisTimeSec)
    ]);
    this.analysisTimeChartOptions = this.buildBarOptions('s', analysisTimeValues);

    const trustLabels = ['Stability score (%)', 'Confidence level (%)'];
    const trustDatasets: LabeledBarDataset[] = entries.map((entry, index) => ({
      label: entry.aiProvider,
      data: [
        this.toNumber(entry.stabilityScore) * 100,
        this.toNumber(entry.confidenceInterval?.confidenceLevel ?? 0) * 100
      ],
      backgroundColor: this.chartPalette[index % this.chartPalette.length],
      borderRadius: 14,
      maxBarThickness: 34,
      showValueLabel: true
    }));
    this.stabilityConfidenceChartData = {
      labels: trustLabels,
      datasets: trustDatasets
    };
    const trustValues = entries.flatMap(entry => [
      this.toNumber(entry.stabilityScore) * 100,
      this.toNumber(entry.confidenceInterval?.confidenceLevel ?? 0) * 100
    ]);
    this.stabilityConfidenceChartOptions = this.buildBarOptions('%', trustValues);

    const groupedLabels = ['Avg analysis time (s)', 'Avg estimated hours', 'Stability score', 'Confidence level'];
    const groupedValues = entries.map(entry => [
      this.toNumber(entry.avgAnalysisTimeSec),
      this.toNumber(entry.avgEstimatedResolutionHours),
      this.toNumber(entry.stabilityScore),
      this.toNumber(entry.confidenceInterval?.confidenceLevel ?? 0)
    ]);
    this.groupedMetricChartData = {
      labels: groupedLabels,
      datasets: entries.map((entry, index) => ({
        label: entry.aiProvider,
        data: groupedValues[index],
        backgroundColor: this.chartPalette[index % this.chartPalette.length],
        borderRadius: 14,
        maxBarThickness: 38
      }))
    };
    const groupedFlatValues = groupedValues.flat();
    this.groupedMetricChartOptions = this.buildBarOptions('', groupedFlatValues);

    this.analysisRangeChartData = this.buildRangeChartData(
      entries,
      entry => this.toNumber(entry.minAnalysisTimeSec),
      entry => this.toNumber(entry.maxAnalysisTimeSec),
      'analysis-range'
    );
    const analysisRangeValues = entries.flatMap(entry => [entry.minAnalysisTimeSec, entry.maxAnalysisTimeSec]);
    this.analysisRangeChartOptions = this.buildRangeChartOptions('s', analysisRangeValues.map(value => this.toNumber(value)));

    this.estimationRangeChartData = this.buildRangeChartData(
      entries,
      entry => this.toNumber(entry.minEstimatedResolutionHours),
      entry => this.toNumber(entry.maxEstimatedResolutionHours),
      'estimation-range'
    );
    const estimationRangeValues = entries.flatMap(entry => [entry.minEstimatedResolutionHours, entry.maxEstimatedResolutionHours]);
    this.estimationRangeChartOptions = this.buildRangeChartOptions('h', estimationRangeValues.map(value => this.toNumber(value)));

    const providerLabels = entries.map(entry => entry.aiProvider);
    const averages = entries.map(entry => this.toNumber(entry.avgAnalysisTimeSec));
    const bounds = entries.map(entry => ({
      min: this.toNumber(entry.confidenceInterval?.lowerBound ?? entry.avgAnalysisTimeSec),
      max: this.toNumber(entry.confidenceInterval?.upperBound ?? entry.avgAnalysisTimeSec)
    }));
    const ciDataset: any = {
      label: 'Average analysis time',
      data: averages,
      backgroundColor: providerLabels.map((_, index) => this.chartPalette[index % this.chartPalette.length]),
      borderRadius: 14,
      maxBarThickness: 38,
      ciBounds: bounds
    };
    this.confidenceIntervalChartData = {
      labels: providerLabels,
      datasets: [ciDataset]
    };
    const ciValues: number[] = [
      ...averages,
      ...bounds.map(bound => bound.min),
      ...bounds.map(bound => bound.max)
    ];
    this.confidenceIntervalChartOptions = this.buildBarOptions('s', ciValues);
  }

  private buildRangeChartData(
    entries: ModelComparisonEntry[],
    minSelector: (entry: ModelComparisonEntry) => number,
    maxSelector: (entry: ModelComparisonEntry) => number,
    stackKey: string
  ): ChartConfiguration<'bar'>['data'] {
    const labels = entries.map(entry => entry.aiProvider);
    const mins = entries.map(minSelector);
    const maxs = entries.map(maxSelector);
    const ranges = maxs.map((max, index) => Math.max(max - mins[index], 0));

    return {
      labels,
      datasets: [
        {
          label: 'Minimum',
          data: mins,
          backgroundColor: mins.map(() => 'rgba(0, 0, 0, 0)'),
          borderColor: mins.map(() => 'rgba(0, 0, 0, 0)'),
          hoverBackgroundColor: mins.map(() => 'rgba(0, 0, 0, 0)'),
          stack: stackKey,
          barThickness: 28
        },
        {
          label: 'Range (max - min)',
          data: ranges,
          backgroundColor: entries.map((_, index) => this.chartPalette[index % this.chartPalette.length]),
          stack: stackKey,
          barThickness: 28,
          borderRadius: 14
        }
      ]
    };
  }

  private buildRangeChartOptions(unitSuffix: string, values: number[]): ChartConfiguration<'bar'>['options'] {
    const options = this.buildBarOptions(unitSuffix, values);
    if (options.scales?.['x']) {
      options.scales['x'].stacked = true;
    }
    if (options.scales?.['y']) {
      options.scales['y'].stacked = true;
    }
    return options;
  }

  private resetCharts(): void {
    this.resolutionHoursChartData = null;
    this.resolutionHoursChartOptions = null;
    this.analysisTimeChartData = null;
    this.analysisTimeChartOptions = null;
    this.stabilityConfidenceChartData = null;
    this.stabilityConfidenceChartOptions = null;
    this.groupedMetricChartData = null;
    this.groupedMetricChartOptions = null;
    this.analysisRangeChartData = null;
    this.analysisRangeChartOptions = null;
    this.estimationRangeChartData = null;
    this.estimationRangeChartOptions = null;
    this.confidenceIntervalChartData = null;
    this.confidenceIntervalChartOptions = null;
  }

  private buildBarOptions(unitSuffix: string, values: number[], upperBoundHint?: number): ChartConfiguration<'bar'>['options'] {
    const sanitizedValues = values.map(v => this.toNumber(v)).filter(value => Number.isFinite(value));
    const suggestedMax = this.computeYAxisMax(sanitizedValues, upperBoundHint);
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: '#475569',
            font: { weight: 600 }
          },
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          suggestedMax,
          ticks: {
            color: '#94a3b8',
            callback: value => {
              const numeric = typeof value === 'number' ? value : Number(value);
              if (!Number.isFinite(numeric)) {
                return value as string;
              }
              const precision = numeric >= 10 ? 0 : 2;
              const formatted = numeric.toFixed(precision).replace(/\.0+$/, '');
              return unitSuffix ? `${formatted} ${unitSuffix}` : formatted;
            }
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.3)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            color: '#0f172a'
          }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const value = typeof context.parsed?.y === 'number' ? context.parsed.y : context.parsed;
              const label = context.dataset?.label ?? 'Model';
              const suffix = unitSuffix ? ` ${unitSuffix}` : '';
              return `${label}: ${Number(value).toFixed(2)}${suffix}`;
            }
          }
        },
        datalabels: {
          display: false
        }
      }
    };
  }

  private computeYAxisMax(values: number[], fallback?: number): number {
    const filtered = values.filter(value => Number.isFinite(value));
    const rawMax = filtered.length ? Math.max(...filtered, 0) : 0;
    const targetMax = Math.max(rawMax, fallback ?? 0);
    if (targetMax <= 0) {
      return 1;
    }
    const magnitude = Math.pow(10, Math.floor(Math.log10(targetMax)));
    return Math.ceil(targetMax / magnitude) * magnitude;
  }
}
