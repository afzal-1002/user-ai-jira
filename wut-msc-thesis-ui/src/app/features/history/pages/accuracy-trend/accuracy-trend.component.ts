import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HistoryService } from '../../services/history.service';
import { AccuracyTrendResult } from '../../models/history.models';
import { FormsModule } from '@angular/forms';
import { LineTrendChartComponent } from '../../../../shared/charts/line-trend-chart.component';

@Component({
  selector: 'app-accuracy-trend',
  standalone: true,
  imports: [CommonModule, FormsModule, LineTrendChartComponent],
  templateUrl: './accuracy-trend.component.html',
  styleUrls: ['./accuracy-trend.component.scss']
})
export class AccuracyTrendComponent implements OnInit {
  provider = 'GEMINI';
  isLoading = false;
  error = '';
  trend: AccuracyTrendResult[] = [];

  constructor(private historyService: HistoryService, private router: Router) {}

  ngOnInit(): void {
    this.loadTrend();
  }

  loadTrend(): void {
    this.isLoading = true;
    this.error = '';
    this.historyService.getAccuracyTrend(this.provider).subscribe({
      next: (data) => {
        this.trend = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load accuracy trend', err);
        this.error = 'Failed to load accuracy trend.';
        this.isLoading = false;
      }
    });
  }

  onProviderChange(): void {
    this.loadTrend();
  }

  get maePoints(): number[] {
    return (this.trend || []).map((t) => t.meanAbsoluteError);
  }

  goBack(): void {
    this.router.navigate(['/history']);
  }
}
