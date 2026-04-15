import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-ai-eval-stability',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-eval-stability.component.html',
  styleUrls: ['./ai-eval-stability.component.css']
})
export class AiEvalStabilityComponent implements OnChanges {
  @Input() isLoading = false;
  @Input() error: string | null = null;
  @Input() issueLabel = '';
  @Input() stabilityBarData: any;
  @Input() stabilityBarOptions: any;
  @Input() stabilityBarType: any = 'bar';
  @Input() stabilityLineData: any;
  @Input() stabilityLineOptions: any;
  @Input() stabilityLineType: any = 'line';
  @Input() stabilityPieData: any;
  @Input() stabilityPieOptions: any;
  @Input() stabilityPieType: any = 'pie';
  @Input() stabilityRadarData: any;
  @Input() stabilityRadarOptions: any;
  @Input() stabilityRadarType: any = 'radar';

  summaryMetrics: { label: string; value: string }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stabilityBarData']) {
      this.summaryMetrics = this.buildSummaryMetrics();
    }
  }

  private buildSummaryMetrics(): { label: string; value: string }[] {
    const dataset = this.stabilityBarData?.datasets?.[0];
    const labels: string[] = this.stabilityBarData?.labels ?? [];
    if (!dataset?.data?.length || !labels.length) {
      return [];
    }

    const metrics: { label: string; value: string }[] = labels
      .map((label, index) => {
        const value = this.toNumber(dataset.data[index]);
        if (!Number.isFinite(value)) {
          return null;
        }
        return { label, value: this.formatHours(value) };
      })
      .filter((metric): metric is { label: string; value: string } => !!metric);

    const minValue = this.pickValue(labels, dataset, 'min');
    const maxValue = this.pickValue(labels, dataset, 'max');
    if (minValue !== null && maxValue !== null) {
      const range = maxValue - minValue;
      metrics.push({ label: 'Range', value: this.formatHours(range) });
    }

    return metrics;
  }

  private pickValue(labels: string[], dataset: any, keyword: string): number | null {
    const index = labels.findIndex(label => label?.toLowerCase().includes(keyword));
    if (index === -1) {
      return null;
    }
    const value = this.toNumber(dataset.data?.[index]);
    return Number.isFinite(value) ? value : null;
  }

  private toNumber(value: any): number {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  private formatHours(value: number): string {
    if (!Number.isFinite(value)) {
      return '';
    }
    return `${Number(value.toFixed(2)).toString()}h`;
  }
}
