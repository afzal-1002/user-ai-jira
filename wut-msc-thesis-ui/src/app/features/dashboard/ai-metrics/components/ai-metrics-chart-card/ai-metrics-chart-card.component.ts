import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Chart, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import ChartDataLabels from 'chartjs-plugin-datalabels';

let dataLabelsRegistered = false;
if (typeof window !== 'undefined' && !dataLabelsRegistered) {
  Chart.register(ChartDataLabels);
  dataLabelsRegistered = true;
}

@Component({
  selector: 'app-ai-metrics-chart-card',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-metrics-chart-card.component.html',
  styleUrls: ['./ai-metrics-chart-card.component.css']
})
export class AiMetricsChartCardComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() caption?: string;
  @Input() chartType: ChartType = 'bar';
  @Input() chartData: any;
  @Input() chartOptions: any;
  @Input() size: 'default' | 'compact' = 'default';
  @Input() canvasMaxWidth?: number;
  @Input() canvasMinHeight?: number;
  @Input() dense = false;
  @Input() cardMaxWidth?: number;
  @Input() emptyMessage = 'No data available for this visualization.';

  get hasData(): boolean {
    return Boolean(
      this.chartData &&
      Array.isArray(this.chartData.datasets) &&
      this.chartData.datasets.length
    );
  }

  get resolvedMaxWidth(): number {
    if (typeof this.canvasMaxWidth === 'number') {
      return this.canvasMaxWidth;
    }
    return this.size === 'compact' ? 340 : 560;
  }

  get resolvedMinHeight(): number {
    if (typeof this.canvasMinHeight === 'number') {
      return this.canvasMinHeight;
    }
    return this.size === 'compact' ? 160 : 200;
  }
}
