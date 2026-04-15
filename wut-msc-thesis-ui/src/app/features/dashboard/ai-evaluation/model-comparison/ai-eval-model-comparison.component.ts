import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AiMetricsChartCardComponent } from '../../ai-metrics/components/ai-metrics-chart-card/ai-metrics-chart-card.component';
import { AiEvalBugModelComparisonComponent } from './ai-eval-bug-model-comparison.component';

@Component({
  selector: 'app-ai-eval-model-comparison',
  standalone: true,
  imports: [CommonModule, NgChartsModule, AiMetricsChartCardComponent, AiEvalBugModelComparisonComponent],
  templateUrl: './ai-eval-model-comparison.component.html',
  styleUrls: ['./ai-eval-model-comparison.component.css']
})
export class AiEvalModelComparisonComponent implements OnChanges {
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Input() comparisonPerfAvgBarData: any;
  @Input() comparisonPerfAvgBarOptions: any;
  @Input() comparisonPerfAvgBarType: any = 'bar';
  @Input() comparisonPerfDetailBarData: any;
  @Input() comparisonPerfDetailBarOptions: any;
  @Input() comparisonPerfDetailBarType: any = 'bar';
  @Input() comparisonRadarData: any;
  @Input() comparisonRadarOptions: any;
  @Input() comparisonRadarType: any = 'radar';
  @Input() estimationComparisonBarData: any;
  @Input() estimationComparisonBarOptions: any;
  @Input() estimationComparisonBarType: any = 'bar';
  @Input() stabilityComparisonPieData: any;
  @Input() stabilityComparisonPieOptions: any;
  @Input() stabilityComparisonPieType: any = 'pie';
  @Input() qualityVsSpeedScatterData: any;
  @Input() qualityVsSpeedScatterOptions: any;
  @Input() qualityVsSpeedScatterType: any = 'scatter';
  @Input() compositeScoreBarData: any;
  @Input() compositeScoreBarOptions: any;
  @Input() compositeScoreBarType: any = 'bar';
  @Input() advantageDivergingBarData: any;
  @Input() advantageDivergingBarOptions: any;
  @Input() advantageDivergingBarType: any = 'bar';
  @Input() comparisonHeatmapMatrix: Array<{ label: string; metrics: Array<{ key: string; label: string; value: number; normalized: number }> }> | null = null;
  @Input() responseTimeBoxPlotData: Array<{ label: string; min: number; q1: number; median: number; q3: number; max: number }> | null = null;
  @Input() responseTimeBoxPlotRange: { min: number; max: number } | null = null;
  @Input() speedQualityBubbleData: any;
  @Input() speedQualityBubbleOptions: any;
  @Input() speedQualityBubbleType: any = 'bubble';
  @Input() estimationRangeStackedData: any;
  @Input() estimationRangeStackedOptions: any;
  @Input() estimationRangeStackedType: any = 'bar';
  @Input() stabilitySlopeData: any;
  @Input() stabilitySlopeOptions: any;
  @Input() stabilitySlopeType: any = 'line';

  summaryMetrics: { label: string; value: string }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['comparisonPerfAvgBarData'] ||
      changes['comparisonPerfDetailBarData'] ||
      changes['estimationComparisonBarData'] ||
      changes['stabilityComparisonPieData'] ||
      changes['qualityVsSpeedScatterData'] ||
      changes['compositeScoreBarData'] ||
      changes['advantageDivergingBarData'] ||
      changes['speedQualityBubbleData']
    ) {
      this.summaryMetrics = this.buildSummaryMetrics();
    }
  }

  private buildSummaryMetrics(): { label: string; value: string }[] {
    const metrics: { label: string; value: string }[] = [];
    const perfEntries = this.extractEntries(this.comparisonPerfAvgBarData);
    if (perfEntries.length) {
      const fastest = perfEntries.reduce((best, entry) => (entry.value < best.value ? entry : best), perfEntries[0]);
      const slowest = perfEntries.reduce((worst, entry) => (entry.value > worst.value ? entry : worst), perfEntries[0]);
      if (fastest) {
        metrics.push({ label: 'Fastest model', value: `${fastest.label} (${this.formatSeconds(fastest.value)})` });
      }
      if (slowest) {
        metrics.push({ label: 'Slowest model', value: `${slowest.label} (${this.formatSeconds(slowest.value)})` });
      }
      if (perfEntries.length > 1) {
        metrics.push({ label: 'Speed delta', value: this.formatSeconds(slowest.value - fastest.value) });
      }
    }

    const estimationEntries = this.extractEntries(this.estimationComparisonBarData);
    if (estimationEntries.length) {
      const conservative = estimationEntries.reduce((best, entry) => (entry.value > best.value ? entry : best), estimationEntries[0]);
      const lean = estimationEntries.reduce((best, entry) => (entry.value < best.value ? entry : best), estimationEntries[0]);
      metrics.push({ label: 'Lean estimator', value: `${lean.label} (${this.formatHours(lean.value)})` });
      if (conservative.label !== lean.label) {
        metrics.push({ label: 'Most conservative', value: `${conservative.label} (${this.formatHours(conservative.value)})` });
      }
    }

    const stabilityEntries = this.extractEntries(this.stabilityComparisonPieData);
    if (stabilityEntries.length) {
      const mostStable = stabilityEntries.reduce((best, entry) => (entry.value > best.value ? entry : best), stabilityEntries[0]);
      metrics.push({ label: 'Most stable output', value: `${mostStable.label} (${this.formatScore(mostStable.value)})` });
    }

    const scatterEntries = this.extractScatterEntries(this.qualityVsSpeedScatterData);
    if (scatterEntries.length) {
      const relevanceLeader = scatterEntries.reduce((best, entry) => (entry.relevance > best.relevance ? entry : best), scatterEntries[0]);
      metrics.push({ label: 'Relevance leader', value: `${relevanceLeader.label} (${this.formatScore(relevanceLeader.relevance)})` });
    }

    const compositeEntries = this.extractEntries(this.compositeScoreBarData);
    if (compositeEntries.length) {
      const decisionLeader = compositeEntries.reduce((best, entry) => (entry.value > best.value ? entry : best), compositeEntries[0]);
      metrics.push({ label: 'Composite leader', value: `${decisionLeader.label} (${this.formatScore(decisionLeader.value)})` });
    }

    const bubbleEntries = this.extractBubbleEntries(this.speedQualityBubbleData);
    if (bubbleEntries.length) {
      const stabilityLeader = bubbleEntries.reduce((best, entry) => (entry.radius > best.radius ? entry : best), bubbleEntries[0]);
      metrics.push({ label: 'Stability bubble', value: `${stabilityLeader.label} (r=${stabilityLeader.radius.toFixed(1)})` });
    }

    const labelSet = new Set<string>();
    perfEntries.forEach(entry => labelSet.add(entry.label));
    estimationEntries.forEach(entry => labelSet.add(entry.label));
    stabilityEntries.forEach(entry => labelSet.add(entry.label));
    scatterEntries.forEach(entry => labelSet.add(entry.label));
    compositeEntries.forEach(entry => labelSet.add(entry.label));
    bubbleEntries.forEach(entry => labelSet.add(entry.label));

    if (labelSet.size) {
      metrics.unshift({ label: 'Models compared', value: labelSet.size.toString() });
    }

    return metrics;
  }

  private extractEntries(source: any): Array<{ label: string; value: number }> {
    if (!source?.labels?.length || !source?.datasets?.length) {
      return [];
    }

    const dataset = source.datasets[0];
    if (!dataset?.data?.length) {
      return [];
    }

    return source.labels
      .map((label: string, index: number) => ({
        label,
        value: this.toNumber(dataset.data[index])
      }))
      .filter((entry: { label: string; value: number }) => Number.isFinite(entry.value));
  }

  private toNumber(value: any): number {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  private formatSeconds(value: number): string {
    if (!Number.isFinite(value)) {
      return '';
    }
    if (value < 1) {
      return `${value.toFixed(2)}s`;
    }
    return `${value.toFixed(2).replace(/\.0+$/, '')}s`;
  }

  private formatHours(value: number): string {
    if (!Number.isFinite(value)) {
      return '';
    }
    return `${value.toFixed(2)}h`;
  }

  private formatScore(value: number): string {
    if (!Number.isFinite(value)) {
      return '';
    }
    return value.toFixed(2);
  }

  private extractScatterEntries(source: any): Array<{ label: string; speed: number; relevance: number }> {
    if (!source?.datasets?.length) {
      return [];
    }

    return source.datasets
      .map((dataset: any) => {
        const point = dataset?.data?.[0];
        if (!point || typeof point !== 'object') {
          return null;
        }
        const speed = this.toNumber(point?.x);
        const relevance = this.toNumber(point?.y);
        if (!Number.isFinite(speed) || !Number.isFinite(relevance)) {
          return null;
        }
        return {
          label: typeof dataset?.label === 'string' && dataset.label.trim().length ? dataset.label : 'Model',
          speed,
          relevance
        };
      })
      .filter((entry: { label: string; speed: number; relevance: number } | null): entry is { label: string; speed: number; relevance: number } => !!entry);
  }

  private extractBubbleEntries(source: any): Array<{ label: string; radius: number }> {
    if (!source?.datasets?.length) {
      return [];
    }

    return source.datasets
      .map((dataset: any) => {
        const radius = this.toNumber(dataset?.data?.[0]?.r);
        if (!Number.isFinite(radius)) {
          return null;
        }
        return {
          label: typeof dataset?.label === 'string' && dataset.label.trim().length ? dataset.label : 'Model',
          radius
        };
      })
      .filter((entry: { label: string; radius: number } | null): entry is { label: string; radius: number } => !!entry);
  }

  heatmapStyle(value: number | null | undefined): { background: string; color: string } {
    const clamped = this.clamp01(typeof value === 'number' ? value : 0);
    const hue = 210 - clamped * 160;
    const lightness = 88 - clamped * 35;
    const background = `hsl(${hue}, 70%, ${lightness}%)`;
    const color = clamped > 0.65 ? '#0f172a' : '#1f2937';
    return { background, color };
  }

  boxScale(value: number): number {
    if (!this.responseTimeBoxPlotRange) {
      return 0;
    }
    const { min, max } = this.responseTimeBoxPlotRange;
    if (max <= min) {
      return 0;
    }
    return ((value - min) / (max - min)) * 100;
  }

  boxWidth(start: number, end: number): number {
    return Math.max(this.boxScale(end) - this.boxScale(start), 0);
  }

  private clamp01(value: number): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (value < 0) {
      return 0;
    }
    if (value > 1) {
      return 1;
    }
    return value;
  }

  get heatmapColumnTemplate(): string {
    const metricCount = this.comparisonHeatmapMatrix?.[0]?.metrics?.length ?? 0;
    const safeCount = Math.max(metricCount, 1);
    return `160px repeat(${safeCount}, minmax(90px, 1fr))`;
  }
}
