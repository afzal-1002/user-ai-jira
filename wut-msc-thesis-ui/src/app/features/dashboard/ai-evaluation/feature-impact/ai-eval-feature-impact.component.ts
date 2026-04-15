import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-ai-eval-feature-impact',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-eval-feature-impact.component.html',
  styleUrls: ['./ai-eval-feature-impact.component.css']
})
export class AiEvalFeatureImpactComponent implements OnChanges {
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Input() markdownEnabledPieData: any;
  @Input() markdownDisabledPieData: any;
  @Input() markdownPieOptions: any;
  @Input() markdownPieType: any = 'pie';
  @Input() markdownBarData: any;
  @Input() markdownBarOptions: any;
  @Input() markdownBarType: any = 'bar';

  summaryMetrics: { label: string; value: string }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['markdownBarData']) {
      this.summaryMetrics = this.buildSummaryMetrics();
    }
  }

  private buildSummaryMetrics(): { label: string; value: string }[] {
    const datasets = this.markdownBarData?.datasets;
    const labels: string[] = this.markdownBarData?.labels ?? [];
    if (!Array.isArray(datasets) || datasets.length < 2 || !labels.length) {
      return [];
    }

    const enabled = datasets[0];
    const disabled = datasets[1];
    const runsIndex = this.findLabelIndex(labels, 'runs');
    const timeIndex = this.findLabelIndex(labels, 'time');

    const metrics: { label: string; value: string }[] = [];

    if (runsIndex !== -1) {
      const enabledRuns = this.toNumber(enabled.data?.[runsIndex]);
      const disabledRuns = this.toNumber(disabled.data?.[runsIndex]);
      const deltaRuns = enabledRuns - disabledRuns;

      metrics.push({ label: 'Enabled runs', value: this.formatNumber(enabledRuns, 0) });
      metrics.push({ label: 'Disabled runs', value: this.formatNumber(disabledRuns, 0) });
      metrics.push({ label: 'Runs delta', value: this.decorateDelta(deltaRuns, 0, false) });
    }

    if (timeIndex !== -1) {
      const enabledTimeSec = this.toNumber(enabled.data?.[timeIndex]);
      const disabledTimeSec = this.toNumber(disabled.data?.[timeIndex]);
      const deltaSec = enabledTimeSec - disabledTimeSec;

      metrics.push({ label: 'Enabled avg time', value: this.formatSeconds(enabledTimeSec) });
      metrics.push({ label: 'Disabled avg time', value: this.formatSeconds(disabledTimeSec) });
      metrics.push({ label: 'Time delta', value: this.decorateDelta(deltaSec, 2, true) });
    }

    return metrics;
  }

  private findLabelIndex(labels: string[], keyword: string): number {
    return labels.findIndex(label => label?.toLowerCase().includes(keyword));
  }

  private toNumber(value: any): number {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  private formatNumber(value: number, fractionDigits = 2): string {
    if (!Number.isFinite(value)) {
      return '';
    }
    return Number(value.toFixed(fractionDigits)).toString();
  }

  private formatSeconds(value: number): string {
    if (!Number.isFinite(value)) {
      return '';
    }
    if (value < 1) {
      return `${value.toFixed(2)}s`;
    }
    return `${Number(value.toFixed(2)).toString()}s`;
  }

  private decorateDelta(value: number, fractionDigits: number, asSeconds: boolean): string {
    const magnitude = Math.abs(value);
    const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
    if (asSeconds) {
      return prefix ? `${prefix}${this.formatSeconds(magnitude)}` : this.formatSeconds(magnitude);
    }
    const formatted = this.formatNumber(magnitude, fractionDigits);
    return prefix ? `${prefix}${formatted}` : formatted;
  }
}
