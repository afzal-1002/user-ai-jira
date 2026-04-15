import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HistoryService } from '../../services/history.service';
import { ModelComparisonResult } from '../../models/history.models';
import { BarComparisonChartComponent } from '../../../../shared/charts/bar-comparison-chart.component';

@Component({
  selector: 'app-model-comparison',
  standalone: true,
  imports: [CommonModule, BarComparisonChartComponent],
  templateUrl: './model-comparison.component.html',
  styleUrls: ['./model-comparison.component.scss']
})
export class ModelComparisonComponent implements OnInit {
  isLoading = false;
  error = '';
  comparison: ModelComparisonResult[] = [];

  constructor(private historyService: HistoryService, private router: Router) {}

  ngOnInit(): void {
    this.loadComparison();
  }

  loadComparison(): void {
    this.isLoading = true;
    this.error = '';
    this.historyService.getModelComparison().subscribe({
      next: (data) => {
        this.comparison = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load model comparison history', err);
        this.error = 'Failed to load model comparison history.';
        this.isLoading = false;
      }
    });
  }

  private getErrorsFor(model: 'gemini' | 'deepSeek'): number[] {
    return (this.comparison || [])
      .map((c) => {
        if (!c.actualHours && c.actualHours !== 0) return null;
        const estimate = model === 'gemini' ? c.geminiEstimate : c.deepSeekEstimate;
        if (estimate == null) return null;
        return Math.abs(estimate - c.actualHours);
      })
      .filter((v): v is number => v != null);
  }

  private getAverage(values: number[]): number {
    if (!values.length) return 0;
    const sum = values.reduce((s, v) => s + v, 0);
    return sum / values.length;
  }

  get labels(): string[] {
    return ['Gemini Error', 'DeepSeek Error'];
  }

  get values(): number[] {
    const gem = this.getErrorsFor('gemini');
    const ds = this.getErrorsFor('deepSeek');
    return [this.getAverage(gem), this.getAverage(ds)];
  }

  goBack(): void {
    this.router.navigate(['/history']);
  }
}
