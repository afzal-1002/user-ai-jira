import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { AiResearchEvaluationService } from '../../../services/ai/ai-research-evaluation.service';
import { AuthService } from '../../../services/auth/auth.service';
import { AiMetricsChartCardComponent } from '../../dashboard/ai-metrics/components/ai-metrics-chart-card/ai-metrics-chart-card.component';

@Component({
  selector: 'app-ai-explainability-tradeoff',
  standalone: true,
  imports: [CommonModule, AiMetricsChartCardComponent],
  templateUrl: './ai-explainability-tradeoff.component.html',
  styleUrls: ['./ai-explainability-tradeoff.component.css', '../research-shared.css']
})
export class AiExplainabilityTradeoffComponent {
  isLoading = false;
  error = '';
  result: any = null;
  explainabilitySummaryChips: Array<{ label: string; value: string }> = [];

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

  explainabilityChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  explainabilityChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true },
      datalabels: this.datalabelsConfig
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#e2e8f0' } }
    }
  };

  explanationDistributionChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  explanationDistributionChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  private readonly palette = ['#0ea5e9', '#f97316', '#a855f7'];

  constructor(
    private researchService: AiResearchEvaluationService,
    private router: Router,
    private authService: AuthService
  ) {
    this.loadExplainability();
  }

  loadExplainability(): void {
    this.isLoading = true;
    this.error = '';
    this.researchService.getExplainabilityTradeoff().subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
        this.buildCharts();
      },
      error: (err) => {
        console.error('Explainability trade-off error', err);
        this.error = 'Failed to load explainability trade-off metrics.';
        this.isLoading = false;
      }
    });
  }

  get labels(): string[] {
    return ['Explanation ON', 'Explanation OFF'];
  }

  get qualityValues(): number[] {
    const rows = Array.isArray(this.result) ? this.result : [];
    const on = rows.filter((r: any) => r?.explanationEnabled === true);
    const off = rows.filter((r: any) => r?.explanationEnabled === false);

    const avg = (items: any[], field: string): number => {
      if (!items.length) return 0;
      const sum = items.reduce((s, r) => s + (Number(r?.[field]) || 0), 0);
      return this.round(sum / items.length);
    };

    return [
      avg(on, 'avgEngineeringScore'),
      avg(off, 'avgEngineeringScore')
    ];
  }

  get latencyValues(): number[] {
    const rows = Array.isArray(this.result) ? this.result : [];
    const on = rows.filter((r: any) => r?.explanationEnabled === true);
    const off = rows.filter((r: any) => r?.explanationEnabled === false);

    const avg = (items: any[], field: string): number => {
      if (!items.length) return 0;
      const sum = items.reduce((s, r) => s + (Number(r?.[field]) || 0), 0);
      return this.round(sum / items.length);
    };

    // backend field is avgResponseTimeSec (seconds); use seconds directly for the chart
    return [
      avg(on, 'avgResponseTimeSec'),
      avg(off, 'avgResponseTimeSec')
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

  private buildCharts(): void {
    const labels = this.labels;
    const quality = this.qualityValues;
    const latency = this.latencyValues;

    if (labels.length && (quality.some(Number.isFinite) || latency.some(Number.isFinite))) {
      this.explainabilityChartData = {
        labels,
        datasets: [
          {
            label: 'Quality score',
            data: quality,
            backgroundColor: this.palette[0],
            borderRadius: 12,
            maxBarThickness: 40
          },
          {
            label: 'Latency (sec)',
            data: latency,
            backgroundColor: this.palette[1],
            borderRadius: 12,
            maxBarThickness: 40
          }
        ]
      };
    } else {
      this.explainabilityChartData = { labels: [], datasets: [] };
    }

    const distribution = this.explanationDistribution();
    if (distribution.total > 0) {
      this.explanationDistributionChartData = {
        labels: ['Explanation ON', 'Explanation OFF'],
        datasets: [
          {
            data: [distribution.on, distribution.off],
            backgroundColor: [this.palette[0], this.palette[1]]
          }
        ]
      };
    } else {
      this.explanationDistributionChartData = { labels: [], datasets: [] };
    }

    this.explainabilitySummaryChips = this.computeSummaryChips(quality, latency, distribution.total);
  }

  private explanationDistribution(): { on: number; off: number; total: number } {
    const rows = Array.isArray(this.result) ? this.result : [];
    let on = 0;
    let off = 0;
    for (const row of rows) {
      if (row?.explanationEnabled === true) {
        on += 1;
      } else if (row?.explanationEnabled === false) {
        off += 1;
      }
    }
    return { on, off, total: on + off };
  }

  private computeSummaryChips(quality: number[], latency: number[], totalRuns: number): Array<{ label: string; value: string }> {
    if (!quality.length || !latency.length) {
      return [];
    }

    const deltaQuality = quality[0] - quality[1];
    const deltaLatency = latency[0] - latency[1];

    const qualityLabel = Number.isFinite(deltaQuality)
      ? `${deltaQuality >= 0 ? '+' : ''}${deltaQuality.toFixed(2)}`
      : '—';
    const latencyLabel = Number.isFinite(deltaLatency)
      ? `${deltaLatency >= 0 ? '+' : ''}${deltaLatency.toFixed(2)} s`
      : '—';

    return [
      { label: 'Quality delta', value: qualityLabel },
      { label: 'Latency delta', value: latencyLabel },
      { label: 'Runs compared', value: totalRuns ? totalRuns.toString() : '0' }
    ];
  }

  private round(value: number): number {
    const numeric = Number(value) || 0;
    return Number(numeric.toFixed(2));
  }
}
