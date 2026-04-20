import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EstimationHistoryRecord } from '../../services/ai/ai-history.service';
import { LineTrendChartComponent } from '../../shared/charts/line-trend-chart.component';

@Component({
  selector: 'app-accuracy-trend-chart',
  standalone: true,
  imports: [CommonModule, LineTrendChartComponent],
  templateUrl: './accuracy-trend-chart.component.html',
  styleUrls: ['./accuracy-trend-chart.component.css']
})
export class AccuracyTrendChartComponent {
  @Input() history: EstimationHistoryRecord[] = [];

  get sorted(): EstimationHistoryRecord[] {
    return [...this.history]
      .filter((r) => r.actualHours != null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  get errorSeries(): number[] {
    return this.sorted.map((r) => Math.abs((r.estimatedHours ?? 0) - (r.actualHours ?? 0)));
  }

  get timeLabels(): string[] {
    return this.sorted.map((r) => new Date(r.createdAt).toISOString().slice(0, 10));
  }
}
