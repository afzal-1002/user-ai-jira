import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { AiResearchEvaluationService } from '../../../services/ai/ai-research-evaluation.service';
import { AuthService } from '../../../services/auth/auth.service';
import { AiMetricsChartCardComponent } from '../../dashboard/ai-metrics/components/ai-metrics-chart-card/ai-metrics-chart-card.component';

@Component({
  selector: 'app-ai-stability-variance',
  standalone: true,
  imports: [CommonModule, AiMetricsChartCardComponent],
  templateUrl: './ai-stability-variance.component.html',
  styleUrls: ['./ai-stability-variance.component.css', '../research-shared.css']
})
export class AiStabilityVarianceComponent {
  isLoading = false;
  error = '';
  result: any = null;
  varianceSummaryChips: Array<{ label: string; value: string }> = [];
  private readonly datalabelsConfig: any = {
    anchor: 'end',
    align: 'end',
    color: '#0f172a',
    font: { size: 11, weight: '600' },
    formatter: (value: unknown) => {
      const numeric = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(numeric) ? numeric.toFixed(2) : '';
    },
    offset: -2,
    clamp: true
  };

  varianceComparisonChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  varianceComparisonChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true },
      datalabels: this.datalabelsConfig
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#e5e7eb' } }
    }
  };

  varianceSummaryChartData: ChartConfiguration<'radar'>['data'] = { labels: [], datasets: [] };
  varianceSummaryChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      r: {
        beginAtZero: true,
        angleLines: { color: '#e2e8f0' },
        grid: { color: '#e2e8f0' },
        suggestedMax: 1
      }
    }
  };

  private readonly palette = ['#2563eb', '#f97316'];

  constructor(
    private researchService: AiResearchEvaluationService,
    private router: Router,
    private authService: AuthService
  ) {
    this.loadStability();
  }

  loadStability(): void {
    this.isLoading = true;
    this.error = '';
    this.researchService.getStabilityVariance().subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
        this.buildCharts();
      },
      error: (err) => {
        console.error('Stability variance error', err);
        this.error = 'Failed to load stability and variance metrics.';
        this.isLoading = false;
      }
    });
  }

  private get stabilityRows(): any[] {
    return Array.isArray(this.result) ? this.result : [];
  }

  get varianceCategories(): string[] {
    const rows = this.stabilityRows;
    return rows.map((r: any, index: number) => (r?.aiProvider as string) || `Provider ${index + 1}`);
  }

  get estimationVariancePerProvider(): number[] {
    const rows = this.stabilityRows;
    return rows.map((r: any) => this.round(Number(r?.estimationVariance) || 0));
  }

  get responseTimeVariancePerProvider(): number[] {
    const rows = this.stabilityRows;
    return rows.map((r: any) => this.round(Number(r?.responseTimeVariance) || 0));
  }

  get varianceSummary(): { label: string; value: number }[] {
    const rows = Array.isArray(this.result) ? this.result : [];
    if (!rows.length) return [];

    // aggregate across providers (average) for a compact thesis figure
    const avgField = (field: string): number => {
      const vals = rows.map((r: any) => Number(r?.[field]) || 0).filter((v) => v > 0);
      if (!vals.length) return 0;
      const sum = vals.reduce((s, v) => s + v, 0);
      return this.round(sum / vals.length);
    };

    return [
      { label: 'Estimation variance', value: avgField('estimationVariance') },
      { label: 'Response time variance', value: avgField('responseTimeVariance') }
    ];
  }

  goBack(): void {
    const user = this.authService.currentUser;
    if (user && user.id != null) {
      this.router.navigate(['user-dashboard', user.id]);
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  private round(value: number): number {
    const numeric = Number(value) || 0;
    return Number(numeric.toFixed(2));
  }

  private buildCharts(): void {
    const labels = this.varianceCategories;
    const estVariance = this.estimationVariancePerProvider;
    const respVariance = this.responseTimeVariancePerProvider;

    if (labels.length && (estVariance.some(Number.isFinite) || respVariance.some(Number.isFinite))) {
      this.varianceComparisonChartData = {
        labels,
        datasets: [
          {
            label: 'Estimation variance',
            data: estVariance,
            backgroundColor: this.palette[0],
            borderRadius: 12,
            maxBarThickness: 42
          },
          {
            label: 'Response time variance',
            data: respVariance,
            backgroundColor: this.palette[1],
            borderRadius: 12,
            maxBarThickness: 42
          }
        ]
      };
    } else {
      this.varianceComparisonChartData = { labels: [], datasets: [] };
    }

    const summary = this.varianceSummary;
    if (summary.length) {
      this.varianceSummaryChartData = {
        labels: summary.map((item) => item.label),
        datasets: [
          {
            label: 'Average variance',
            data: summary.map((item) => Number(item.value.toFixed(2))),
            backgroundColor: 'rgba(14, 165, 233, 0.3)',
            borderColor: '#0ea5e9'
          }
        ]
      };
    } else {
      this.varianceSummaryChartData = { labels: [], datasets: [] };
    }

    this.varianceSummaryChips = this.buildSummaryChips(labels, estVariance, respVariance);
  }

  private buildSummaryChips(labels: string[], estVariance: number[], respVariance: number[]): Array<{ label: string; value: string }> {
    if (!labels.length) {
      return [];
    }
    const bestIndex = estVariance.length ? estVariance.reduce((best, value, index, arr) => (value < arr[best] ? index : best), 0) : 0;
    const respBestIndex = respVariance.length ? respVariance.reduce((best, value, index, arr) => (value < arr[best] ? index : best), 0) : 0;
    const bestEstValue = estVariance.length ? estVariance[bestIndex] ?? 0 : 0;
    const bestRespValue = respVariance.length ? respVariance[respBestIndex] ?? 0 : 0;
    const stableEstLabel = labels.length ? labels[Math.min(bestIndex, labels.length - 1)] : 'N/A';
    const stableLatencyLabel = labels.length ? labels[Math.min(respBestIndex, labels.length - 1)] : 'N/A';

    return [
      { label: 'Stable estimation', value: `${stableEstLabel} (${bestEstValue.toFixed(2)})` },
      { label: 'Stable latency', value: `${stableLatencyLabel} (${bestRespValue.toFixed(2)})` },
      { label: 'Models tracked', value: labels.length.toString() }
    ];
  }
}
