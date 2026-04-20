import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-ai-eval-by-model',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-eval-by-model.component.html',
  styleUrls: ['./ai-eval-by-model.component.css']
})
export class AiEvalByModelComponent implements OnChanges {
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Input() evaluationResult: any;
  @Input() selectedProvider: string | null = null;

  @Input() modelByModelPieData: any;
  @Input() modelByModelPieOptions: any;
  @Input() modelByModelPieType: any = 'pie';
  @Input() modelByModelBarData: any;
  @Input() modelByModelBarOptions: any;
  @Input() modelByModelBarType: any = 'bar';

  summaryMetrics: { label: string; value: string }[] = [];

  distributionBreakdownBarData: any;
  distributionBreakdownBarOptions: any;
  distributionBreakdownBarType: any = 'bar';

  efficiencyLineData: any;
  efficiencyLineOptions: any;
  efficiencyLineType: any = 'line';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modelByModelBarData']) {
      this.modelByModelBarData = this.decorateSingleDatasetBar(this.modelByModelBarData);
    }

    if (changes['evaluationResult'] || changes['selectedProvider']) {
      this.buildSupplementalVisuals(this.evaluationResult);
    }
  }

  private buildSupplementalVisuals(result: any): void {
    if (!result) {
      this.summaryMetrics = [];
      this.distributionBreakdownBarData = null;
      this.distributionBreakdownBarOptions = null;
      this.efficiencyLineData = null;
      this.efficiencyLineOptions = null;
      return;
    }

    const providerLabel = this.resolveProviderLabel(result, this.selectedProvider);
    const totalRuns = this.pickNumber(result, [
      { path: 'totalRuns' },
      { path: 'runs' },
      { path: 'metrics.totalRuns' }
    ]);
    const uniqueIssues = this.pickNumber(result, [
      { path: 'uniqueIssues' },
      { path: 'distinctIssues' },
      { path: 'metrics.uniqueIssues' }
    ]);
    const avgAnalysisSec = this.pickNumber(result, [
      { path: 'avgAnalysisTimeMS', divisor: 1000 },
      { path: 'avgAnalysisTimeMs', divisor: 1000 },
      { path: 'avgAnalysisTimeSec' },
      { path: 'avgResponseTimeSec' }
    ]);
    const avgEstimatedHours = this.pickNumber(result, [
      { path: 'avgEstimatedHours' },
      { path: 'avgHours' }
    ]);
    const successRate = this.pickNumber(result, [
      { path: 'successRate' },
      { path: 'successPercentage' }
    ]);

    this.summaryMetrics = [
      { label: 'Provider', value: providerLabel },
      { label: 'Total runs', value: this.formatNumber(totalRuns, 0) },
      { label: 'Unique issues', value: this.formatNumber(uniqueIssues, 0) },
      { label: 'Avg analysis', value: this.decorateDuration(avgAnalysisSec) },
      { label: 'Avg estimate', value: this.decorateHours(avgEstimatedHours) },
      { label: 'Success rate', value: successRate ? `${this.formatNumber(successRate, 1)}%` : '' }
    ].filter(metric => !!metric.value);

    this.buildDistributionChart(result, providerLabel);
    this.buildEfficiencyLine(avgAnalysisSec, avgEstimatedHours);
  }

  private buildDistributionChart(result: any, providerLabel: string): void {
    const distributionSource = result?.responseStats ?? result?.distribution ?? result;
    const minSec = this.pickNumber(distributionSource, [
      { path: 'minResponseTimeSec' },
      { path: 'minResponseSec' },
      { path: 'minResponseTimeMS', divisor: 1000 },
      { path: 'minAnalysisTimeMS', divisor: 1000 }
    ]);
    const avgSec = this.pickNumber(distributionSource, [
      { path: 'avgResponseTimeSec' },
      { path: 'avgResponseSec' },
      { path: 'avgAnalysisTimeMS', divisor: 1000 },
      { path: 'avgAnalysisTimeSec' }
    ]);
    const maxSec = this.pickNumber(distributionSource, [
      { path: 'maxResponseTimeSec' },
      { path: 'maxResponseSec' },
      { path: 'maxResponseTimeMS', divisor: 1000 },
      { path: 'maxAnalysisTimeMS', divisor: 1000 }
    ]);
    const stdDevSec = this.pickNumber(distributionSource, [
      { path: 'stdDeviationResponseTime' },
      { path: 'stdDevResponseTimeSec' },
      { path: 'stdDevAnalysisTimeMS', divisor: 1000 }
    ]);

    const hasData = [minSec, avgSec, maxSec, stdDevSec].some(value => value > 0);
    if (!hasData) {
      this.distributionBreakdownBarData = null;
      this.distributionBreakdownBarOptions = null;
      return;
    }

    this.distributionBreakdownBarData = {
      labels: [providerLabel || 'Model'],
      datasets: [
        {
          label: 'Min (s)',
          data: [minSec],
          backgroundColor: '#60a5fa',
          borderColor: '#2563eb',
          borderWidth: 1.5,
          maxBarThickness: 32
        },
        {
          label: 'Avg (s)',
          data: [avgSec],
          backgroundColor: '#fbbf24',
          borderColor: '#b45309',
          borderWidth: 1.5,
          maxBarThickness: 32
        },
        {
          label: 'Max (s)',
          data: [maxSec],
          backgroundColor: '#f97316',
          borderColor: '#c2410c',
          borderWidth: 1.5,
          maxBarThickness: 32
        },
        {
          label: 'Std dev (s)',
          data: [stdDevSec],
          backgroundColor: '#9ca3af',
          borderColor: '#4b5563',
          borderWidth: 1.5,
          maxBarThickness: 32
        }
      ]
    };

    const distributionValues = [minSec, avgSec, maxSec, stdDevSec];
    this.distributionBreakdownBarOptions = {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          max: this.computeYAxisMax(distributionValues)
        }
      },
      plugins: {
        legend: { position: 'top' },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#1e293b',
          font: { weight: 'bold', size: 11 },
          formatter: (value: number) => this.formatNumber(value)
        }
      }
    };
  }

  private buildEfficiencyLine(avgAnalysisSec: number, avgEstimatedHours: number): void {
    const avgAnalysisHours = avgAnalysisSec / 3600;
    if (avgAnalysisHours <= 0 && avgEstimatedHours <= 0) {
      this.efficiencyLineData = null;
      this.efficiencyLineOptions = null;
      return;
    }

    const values = [avgAnalysisHours, avgEstimatedHours];
    const dataPoints = values.map(value => Number(value.toFixed(2)));
    this.efficiencyLineData = {
      labels: ['Avg analysis (hr)', 'Avg estimate (hr)'],
      datasets: [
        {
          label: 'Effort profile',
          data: dataPoints,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.25)',
          tension: 0.3,
          fill: true,
          pointRadius: 5
        }
      ]
    };

    this.efficiencyLineOptions = {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          max: this.computeYAxisMax(values)
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '#312e81',
          font: { weight: 'bold', size: 11 },
          formatter: (value: number) => `${this.formatNumber(value)}h`
        }
      }
    };
  }

  private decorateSingleDatasetBar(data: any): any {
    if (!data?.datasets?.length) {
      return data;
    }

    return {
      ...data,
      datasets: data.datasets.map((dataset: any) => ({
        ...dataset,
        barThickness: dataset.barThickness ?? 28,
        maxBarThickness: dataset.maxBarThickness ?? 32,
        borderRadius: dataset.borderRadius ?? 6
      }))
    };
  }

  private pickNumber(source: any, candidates: Array<{ path: string; divisor?: number }>): number {
    for (const candidate of candidates) {
      const raw = this.resolvePath(source, candidate.path);
      if (raw === null || raw === undefined) {
        continue;
      }
      const value = Number(raw);
      if (Number.isFinite(value)) {
        return candidate.divisor ? value / candidate.divisor : value;
      }
    }
    return 0;
  }

  private resolvePath(source: any, path: string): any {
    return path
      .split('.')
      .reduce((acc: any, segment: string) => (acc ? acc[segment] : undefined), source);
  }

  private formatNumber(value: number, fractionDigits = 2): string {
    if (!Number.isFinite(value)) {
      return '';
    }
    return Number(value.toFixed(fractionDigits)).toString();
  }

  private decorateDuration(seconds: number): string {
    if (seconds <= 0) {
      return '';
    }
    if (seconds < 120) {
      return `${this.formatNumber(seconds, 1)}s`;
    }
    const minutes = seconds / 60;
    if (minutes < 120) {
      return `${this.formatNumber(minutes, 1)}m`;
    }
    const hours = minutes / 60;
    return `${this.formatNumber(hours, 1)}h`;
  }

  private decorateHours(hours: number): string {
    if (hours <= 0) {
      return '';
    }
    return `${this.formatNumber(hours, 2)}h`;
  }

  private resolveProviderLabel(result: any, selectedProvider: string | null): string {
    return (
      selectedProvider ||
      result?.provider ||
      result?.aiProvider ||
      result?.providerName ||
      ''
    ).toString();
  }

  private computeYAxisMax(values: number[]): number {
    const finiteValues = values.filter(value => Number.isFinite(value) && value >= 0);
    if (!finiteValues.length) {
      return 1;
    }
    const max = Math.max(...finiteValues);
    if (max <= 1) {
      return 2;
    }
    const ceil = Math.ceil(max);
    const even = ceil % 2 === 0 ? ceil : ceil + 1;
    return even + 2;
  }
}
