import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { AiMetricsChartCardComponent } from '../ai-metrics/components/ai-metrics-chart-card/ai-metrics-chart-card.component';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-ai-response-stats',
  standalone: true,
  imports: [CommonModule, NgChartsModule, AiMetricsChartCardComponent],
  templateUrl: './ai-response-stats.component.html',
  styleUrls: ['./ai-response-stats.component.css']
})
export class AiResponseStatsComponent {
  @Input() isLoading = false;
  @Input() error = '';
  @Input() stats: Array<any> | null = null;
  @Input() barChartData: any;
  @Input() barChartOptions: any;
  @Input() barChartType: any = 'bar';
  @Input() boxChartData: any;
  @Input() boxChartOptions: any;
  @Input() boxChartType: any = 'bar';
  @Input() radarChartData: any;
  @Input() radarChartOptions: any;
  @Input() radarChartType: any = 'radar';
  @Input() lineChartData: any;
  @Input() lineChartOptions: any;
  @Input() lineChartType: any = 'line';

  get hasStats(): boolean {
    return Array.isArray(this.stats) && this.stats.length > 0;
  }
}
