import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { AiResearchEvaluationService } from '../../../services/ai/ai-research-evaluation.service';
import { AuthService } from '../../../services/auth/auth.service';
import { AiMetricsChartCardComponent } from '../../dashboard/ai-metrics/components/ai-metrics-chart-card/ai-metrics-chart-card.component';

@Component({
  selector: 'app-ai-human-in-loop',
  standalone: true,
  imports: [CommonModule, AiMetricsChartCardComponent],
  templateUrl: './ai-human-in-loop.component.html',
  styleUrls: ['./ai-human-in-loop.component.css', '../research-shared.css']
})
export class AiHumanInTheLoopComponent {
  isLoading = false;
  error = '';
  result: any = null;
  humanSummaryChips: Array<{ label: string; value: string }> = [];
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

  promptImpactChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  promptImpactChartOptions: ChartConfiguration<'bar'>['options'] = {
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

  promptDistributionChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  promptDistributionChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '58%',
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  private readonly palette = ['#22c55e', '#3b82f6'];

  constructor(
    private researchService: AiResearchEvaluationService,
    private router: Router,
    private authService: AuthService
  ) {
    this.loadHumanInLoop();
  }

  loadHumanInLoop(): void {
    this.isLoading = true;
    this.error = '';
    this.researchService.getHumanInLoopImpact().subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
        this.buildCharts();
      },
      error: (err) => {
        console.error('Human-in-the-loop error', err);
        this.error = 'Failed to load human-in-the-loop impact metrics.';
        this.isLoading = false;
      }
    });
  }

  get labels(): string[] {
    return ['With user prompt', 'Without user prompt'];
  }

  get qualityValues(): number[] {
    const rows = Array.isArray(this.result) ? this.result : [];
    const withPrompt = rows.filter((r: any) => r?.userPromptProvided === true);
    const withoutPrompt = rows.filter((r: any) => r?.userPromptProvided === false);

    const avg = (items: any[], field: string): number => {
      if (!items.length) return 0;
      const sum = items.reduce((s, r) => s + (Number(r?.[field]) || 0), 0);
      return sum / items.length;
    };

    return [
      this.round(avg(withPrompt, 'avgEngineeringScore')),
      this.round(avg(withoutPrompt, 'avgEngineeringScore'))
    ];
  }

  get relevanceValues(): number[] {
    const rows = Array.isArray(this.result) ? this.result : [];
    const withPrompt = rows.filter((r: any) => r?.userPromptProvided === true);
    const withoutPrompt = rows.filter((r: any) => r?.userPromptProvided === false);

    const avg = (items: any[], field: string): number => {
      if (!items.length) return 0;
      const sum = items.reduce((s, r) => s + (Number(r?.[field]) || 0), 0);
      return sum / items.length;
    };

    // fallback: if no explicit relevance score, reuse engineering score as relevance proxy
    const withRel = avg(withPrompt, 'relevanceScore') || avg(withPrompt, 'avgEngineeringScore');
    const withoutRel = avg(withoutPrompt, 'relevanceScore') || avg(withoutPrompt, 'avgEngineeringScore');

    return [this.round(withRel), this.round(withoutRel)];
  }

  get hasRelevance(): boolean {
    const rows = Array.isArray(this.result) ? this.result : [];
    return rows.some((r: any) => r?.relevanceScore != null || r?.avgEngineeringScore != null);
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
    const relevance = this.relevanceValues;

    if (labels.length && (quality.some(Number.isFinite) || relevance.some(Number.isFinite))) {
      this.promptImpactChartData = {
        labels,
        datasets: [
          {
            label: 'Quality score',
            data: quality,
            backgroundColor: this.palette[0],
            borderRadius: 12,
            maxBarThickness: 42
          },
          {
            label: 'Relevance score',
            data: relevance,
            backgroundColor: this.palette[1],
            borderRadius: 12,
            maxBarThickness: 42
          }
        ]
      };
    } else {
      this.promptImpactChartData = { labels: [], datasets: [] };
    }

    const distribution = this.promptDistribution();
    if (distribution.total > 0) {
      this.promptDistributionChartData = {
        labels,
        datasets: [
          {
            data: [distribution.withPrompt, distribution.withoutPrompt],
            backgroundColor: this.palette
          }
        ]
      };
    } else {
      this.promptDistributionChartData = { labels: [], datasets: [] };
    }

    this.humanSummaryChips = this.computeSummaryChips(quality, relevance, distribution.total);
  }

  private promptDistribution(): { withPrompt: number; withoutPrompt: number; total: number } {
    const rows = Array.isArray(this.result) ? this.result : [];
    let withPrompt = 0;
    let withoutPrompt = 0;
    for (const row of rows) {
      if (row?.userPromptProvided === true) {
        withPrompt += 1;
      } else if (row?.userPromptProvided === false) {
        withoutPrompt += 1;
      }
    }
    return { withPrompt, withoutPrompt, total: withPrompt + withoutPrompt };
  }

  private computeSummaryChips(quality: number[], relevance: number[], samples: number): Array<{ label: string; value: string }> {
    if (!quality.length || !relevance.length) {
      return [];
    }
    const qualityGain = quality[0] - quality[1];
    const relevanceGain = relevance[0] - relevance[1];
    return [
      { label: 'Quality lift', value: Number.isFinite(qualityGain) ? `${qualityGain >= 0 ? '+' : ''}${qualityGain.toFixed(2)}` : '—' },
      { label: 'Relevance lift', value: Number.isFinite(relevanceGain) ? `${relevanceGain >= 0 ? '+' : ''}${relevanceGain.toFixed(2)}` : '—' },
      { label: 'Runs analysed', value: samples ? samples.toString() : '0' }
    ];
  }

  private round(value: number): number {
    const numeric = Number(value) || 0;
    return Number(numeric.toFixed(2));
  }
}
