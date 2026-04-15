import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { AiResearchEvaluationService } from '../../../services/ai/ai-research-evaluation.service';
import { AuthService } from '../../../services/auth/auth.service';
import { AiMetricsChartCardComponent } from '../../dashboard/ai-metrics/components/ai-metrics-chart-card/ai-metrics-chart-card.component';

@Component({
  selector: 'app-ai-bias-analysis',
  standalone: true,
  imports: [CommonModule, AiMetricsChartCardComponent],
  templateUrl: './ai-bias-analysis.component.html',
  styleUrls: ['./ai-bias-analysis.component.css', '../research-shared.css']
})
export class AiBiasAnalysisComponent {
  isLoading = false;
  error = '';
  result: any = null;
  biasSummaryChips: Array<{ label: string; value: string }> = [];

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

  maeChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  maeChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
        text: 'Mean Absolute Error (MAE) by Model',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: { enabled: true },
      datalabels: this.datalabelsConfig
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { weight: 'bold', size: 11 } },
        title: { display: false, text: 'AI Provider', font: { weight: 'bold', size: 12 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#e2e8f0' },
        ticks: { font: { weight: 'bold', size: 11 } },
        title: { display: false, text: 'Error Value', font: { weight: 'bold', size: 12 } }
      }
    }
  };

  errorBreakdownChartData: ChartConfiguration<'pie'>['data'] = { labels: [], datasets: [] };
  errorBreakdownChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { weight: 'bold', size: 11 } }
      },
      title: {
        display: false,
        text: 'Error Metrics Breakdown',
        font: { size: 14, weight: 'bold' }
      },
      tooltip: { enabled: true },
      datalabels: {
        font: { weight: 'bold', size: 11 },
        formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
      }
    }
  };

  private readonly palette = ['#2563eb', '#f97316', '#22c55e', '#14b8a6', '#9333ea'];

  constructor(
    private researchService: AiResearchEvaluationService,
    private router: Router,
    private authService: AuthService
  ) {
    this.loadBias();
  }

  loadBias(): void {
    this.isLoading = true;
    this.error = '';
    this.researchService.getBiasAnalysis().subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
        this.buildCharts();
      },
      error: (err) => {
        console.error('Bias analysis error', err);
        this.error = 'Failed to load bias and error metrics.';
        this.isLoading = false;
      }
    });
  }

  get modelLabels(): string[] {
    const labels = this.biasRows
      .map((r: any) => (r?.aiProvider as string)?.toUpperCase())
      .filter((v: string | undefined) => !!v) as string[];
    const unique = Array.from(new Set(labels));
    return unique.length ? unique : ['GEMINI', 'DEEPSEEK'];
  }

  get maeValues(): number[] {
    const byProvider: Record<string, number> = {};
    for (const row of this.biasRows) {
      if (!row?.aiProvider) continue;
      const key = String(row.aiProvider).toUpperCase();
      byProvider[key] = Number(row?.meanAbsoluteError ?? row?.mae ?? 0);
    }
    return this.modelLabels.map((label) => this.round(byProvider[label] ?? 0));
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

  private get biasRows(): any[] {
    return Array.isArray(this.result) ? this.result : [];
  }

  private buildCharts(): void {
    const labels = this.modelLabels;
    const maeValues = this.maeValues;

    if (labels.length && maeValues.some((value) => Number.isFinite(value))) {
      this.maeChartData = {
        labels,
        datasets: [
          {
            label: 'Mean absolute error',
            data: maeValues,
            backgroundColor: labels.map((_, idx) => this.palette[idx % this.palette.length]),
            borderRadius: 12,
            maxBarThickness: 44
          }
        ]
      };
    } else {
      this.maeChartData = { labels: [], datasets: [] };
    }

    const breakdown = this.buildErrorBreakdown();
    if (breakdown.labels.length) {
      this.errorBreakdownChartData = {
        labels: breakdown.labels,
        datasets: [
          {
            data: breakdown.values,
            backgroundColor: breakdown.labels.map((_, idx) => this.palette[(idx + 2) % this.palette.length])
          }
        ]
      };
    } else {
      this.errorBreakdownChartData = { labels: [], datasets: [] };
    }

    this.biasSummaryChips = this.computeSummaryChips(labels, maeValues);
  }

  private buildErrorBreakdown(): { labels: string[]; values: number[] } {
    const configs: Array<{ key: string; label: string }> = [
      { key: 'meanAbsoluteError', label: 'MAE' },
      { key: 'meanSquaredError', label: 'MSE' },
      { key: 'biasScore', label: 'Bias score' }
    ];
    const labels: string[] = [];
    const values: number[] = [];

    for (const cfg of configs) {
      const avg = this.averageMetric(cfg.key);
      if (avg > 0) {
        labels.push(cfg.label);
        values.push(Number(avg.toFixed(2)));
      }
    }

    return { labels, values };
  }

  private averageMetric(key: string): number {
    const samples = this.biasRows
      .map((row: any) => Number(row?.[key]))
      .filter((value) => Number.isFinite(value) && value >= 0);
    if (!samples.length) {
      return 0;
    }
    const sum = samples.reduce((total, value) => total + value, 0);
    return this.round(sum / samples.length);
  }

  private computeSummaryChips(labels: string[], values: number[]): Array<{ label: string; value: string }> {
    if (!labels.length || !values.length) {
      return [];
    }

    const finite = values.map((value, index) => ({ value, index })).filter(({ value }) => Number.isFinite(value));
    if (!finite.length) {
      return [];
    }

    const sorted = [...finite].sort((a, b) => a.value - b.value);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const gap = worst.value - best.value;

    return [
      { label: 'Best MAE', value: `${labels[best.index]} (${best.value.toFixed(2)})` },
      { label: 'Gap', value: gap > 0 ? `${gap.toFixed(2)} hrs` : '—' },
      { label: 'Models', value: labels.length.toString() }
    ];
  }

  private round(value: number): number {
    const numeric = Number(value) || 0;
    return Number(numeric.toFixed(2));
  }
}
