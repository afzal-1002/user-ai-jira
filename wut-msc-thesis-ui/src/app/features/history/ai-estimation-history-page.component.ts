import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EstimationHistoryRecord, AiHistoryService } from '../../services/ai/ai-history.service';
import { EstimationHistoryTableComponent } from './estimation-history-table.component';
import { AccuracyTrendChartComponent } from './accuracy-trend-chart.component';
import { HistoricalModelComparisonComponent } from './historical-model-comparison.component';

@Component({
  selector: 'app-ai-estimation-history-page',
  standalone: true,
  imports: [CommonModule, RouterModule, EstimationHistoryTableComponent, AccuracyTrendChartComponent, HistoricalModelComparisonComponent],
  templateUrl: './ai-estimation-history-page.component.html',
  styleUrls: ['./ai-estimation-history-page.component.css']
})
export class AiEstimationHistoryPageComponent {
  isLoading = false;
  error = '';
  history: EstimationHistoryRecord[] = [];

  constructor(private historyService: AiHistoryService) {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.error = '';
    this.historyService.getEstimationHistory().subscribe({
      next: (records) => {
        this.history = records || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('History load error', err);
        this.error = 'Failed to load estimation history.';
        this.isLoading = false;
      }
    });
  }

  get hasHistory(): boolean {
    return this.history && this.history.length > 0;
  }
}
