import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AiEstimationsService } from '../../../../services/ai/ai-estimations.service';
import { Chart, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { calculateYAxis } from '../../../../shared/utils/chart-axis.utils';

let overallPluginsRegistered = false;
if (typeof window !== 'undefined' && !overallPluginsRegistered) {
  Chart.register(ChartDataLabels);
  overallPluginsRegistered = true;
}

interface ScoreRow {
  criterion: string;
  gemini: string;
  deepseek: string;
}

@Component({
  selector: 'app-ai-overall-comparison',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-overall-comparison.component.html',
  styleUrls: ['./ai-overall-comparison.component.css']
})
export class AiOverallComparisonComponent implements OnInit {
  isLoading = false;
  error = '';
  rawModels: any[] = [];

  performanceBarData: any;
  performanceBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#111827',
        font: { weight: 'bold', size: 12 },
        formatter: value => (typeof value === 'number' ? `${value.toFixed(2)}s` : value)
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        title: { display: false, text: 'Avg response time (s)' },
        grid: { color: '#e5e7eb' }
      }
    }
  };

  estimationGroupedData: any;
  estimationGroupedOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: v => `${Number(v).toFixed(2)}h`
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#e5e7eb' } }
    }
  };

  stabilityLineData: any;
  stabilityLineOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: { display: false }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        position: 'left',
        title: { display: false, text: 'Stability score / std dev' }
      }
    }
  };

  stabilityPieData: any;
  stabilityPieOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        color: '#111827',
        font: { weight: 'bold', size: 12 },
        formatter: v => Number(v).toFixed(2)
      }
    }
  };

  contentBarData: any;
  contentBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: v => Number(v).toFixed(2)
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        max: 3,
        title: { display: false, text: 'Engineering relevance score' }
      }
    }
  };

  overallRadarData: any;
  overallRadarOptions: ChartOptions<'radar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: {
        color: '#111827',
        font: { size: 11 },
        formatter: v => `${(Number(v) * 100).toFixed(0)}%`
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        suggestedMax: 1,
        ticks: { stepSize: 0.2 }
      }
    }
  };

  scorecardRows: ScoreRow[] = [];
  insights: string[] = [];

  constructor(private aiService: AiEstimationsService) {}

  ngOnInit(): void {
    this.fetchModels();
  }

  private fetchModels(): void {
    this.isLoading = true;
    this.error = '';
    this.aiService.getFullModelComparison().subscribe({
      next: raw => {
        this.rawModels = raw ?? [];
        this.buildCharts();
        this.isLoading = false;
      },
      error: err => {
        console.error('Overall comparison load error', err);
        this.error = 'Failed to load overall comparison.';
        this.isLoading = false;
      }
    });
  }

  private buildCharts(): void {
    if (!this.rawModels.length) {
      this.performanceBarData = null;
      return;
    }

    const labels = this.rawModels.map(m => this.prettyName(m.aiProvider));
    const avg = this.rawModels.map(m => Number(m.avgResponseTimeSec ?? 0));
    const minResp = this.rawModels.map(m => Number(m.minResponseTimeSec ?? 0));
    const maxResp = this.rawModels.map(m => Number(m.maxResponseTimeSec ?? 0));
    const stdResp = this.rawModels.map(m => Number(m.stdDeviationResponseTime ?? 0));

    this.performanceBarData = {
      labels,
      datasets: [
        {
          label: 'Avg response time (s)',
          data: avg,
          backgroundColor: ['#2563eb', '#16a34a'],
          borderRadius: 10,
          barThickness: 38,
          categoryPercentage: 0.5,
          barPercentage: 0.68
        }
      ]
    };

    const avgHours = this.rawModels.map(m => Number(m.avgEstimatedHours ?? 0));
    const minHours = this.rawModels.map(m => Number(m.minEstimatedHours ?? 0));
    const maxHours = this.rawModels.map(m => Number(m.maxEstimatedHours ?? 0));

    this.estimationGroupedData = {
      labels,
      datasets: [
        { label: 'Min (h)', data: minHours, backgroundColor: '#93c5fd', borderRadius: 8 },
        { label: 'Avg (h)', data: avgHours, backgroundColor: '#2563eb', borderRadius: 8 },
        { label: 'Max (h)', data: maxHours, backgroundColor: '#1e3a8a', borderRadius: 8 }
      ]
    };

    const stabilityScores = this.rawModels.map(m => Number(m.stabilityScore ?? 0));
    this.stabilityLineData = {
      labels,
      datasets: [
        {
          label: 'Stability score',
          data: stabilityScores,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.15)',
          fill: true,
          tension: 0.35
        },
        {
          label: 'Std dev (s)',
          data: stdResp,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249,115,22,0.15)',
          fill: true,
          tension: 0.35
        }
      ]
    };
    this.stabilityPieData = {
      labels,
      datasets: [
        { data: stabilityScores, backgroundColor: ['#0ea5e9', '#f97316'] }
      ]
    };

    const relevance = this.rawModels.map(m => Number(m.engineeringRelevanceScore ?? 0));
    const responseLengthK = this.rawModels.map(m => Number(m.avgResponseLength ?? 0) / 1000);
    this.contentBarData = {
      labels,
      datasets: [
        { label: 'Engineering relevance', data: relevance, backgroundColor: '#22c55e', borderRadius: 8 },
        { label: 'Avg response length (k tokens)', data: responseLengthK, backgroundColor: '#0f62fe', borderRadius: 8 }
      ]
    };

    const normalize = (val: number[]) => val.map(v => Math.max(0, v));
    this.overallRadarData = {
      labels: ['Speed', 'Estimation accuracy', 'Stability', 'Content depth', 'Response size'],
      datasets: [
        {
          label: 'Gemini',
          data: normalize([
            1 / (avg[0] || 1),
            1 / (avgHours[0] || 1),
            stabilityScores[0] ?? 0,
            relevance[0] / 3,
            Math.min(1, responseLengthK[0] / (Math.max(...responseLengthK) || 1))
          ]),
          backgroundColor: 'rgba(37,99,235,0.15)',
          borderColor: '#1d4ed8',
          pointBackgroundColor: '#1d4ed8'
        },
        {
          label: 'DeepSeek',
          data: normalize([
            1 / (avg[1] || 1),
            1 / (avgHours[1] || 1),
            stabilityScores[1] ?? 0,
            relevance[1] / 3,
            Math.min(1, responseLengthK[1] / (Math.max(...responseLengthK) || 1))
          ]),
          backgroundColor: 'rgba(16,185,129,0.15)',
          borderColor: '#16a34a',
          pointBackgroundColor: '#16a34a'
        }
      ]
    };

    this.buildScorecard();
    this.buildInsights(avg, avgHours, stabilityScores, relevance);
  }

  private buildScorecard(): void {
    const gem = this.rawModels.find(m => (m.aiProvider ?? '').toUpperCase().includes('GEMINI'));
    const deep = this.rawModels.find(m => (m.aiProvider ?? '').toUpperCase().includes('DEEP'));
    this.scorecardRows = [
      {
        criterion: 'Avg response time (s)',
        gemini: gem ? Number(gem.avgResponseTimeSec ?? 0).toFixed(2) : '—',
        deepseek: deep ? Number(deep.avgResponseTimeSec ?? 0).toFixed(2) : '—'
      },
      {
        criterion: 'Avg estimated hours',
        gemini: gem ? Number(gem.avgEstimatedHours ?? 0).toFixed(2) : '—',
        deepseek: deep ? Number(deep.avgEstimatedHours ?? 0).toFixed(2) : '—'
      },
      {
        criterion: 'Stability score',
        gemini: gem ? Number(gem.stabilityScore ?? 0).toFixed(2) : '—',
        deepseek: deep ? Number(deep.stabilityScore ?? 0).toFixed(2) : '—'
      },
      {
        criterion: 'Engineering relevance',
        gemini: gem ? Number(gem.engineeringRelevanceScore ?? 0).toFixed(2) : '—',
        deepseek: deep ? Number(deep.engineeringRelevanceScore ?? 0).toFixed(2) : '—'
      }
    ];
  }

  private buildInsights(avg: number[], avgHours: number[], stability: number[], relevance: number[]): void {
    if (!avg.length) {
      this.insights = [];
      return;
    }
    this.insights = [
      avg[1] < avg[0]
        ? 'DeepSeek responds faster than Gemini across aggregate runs.'
        : 'Gemini responds faster in the latest aggregate sample.',
      avgHours[0] > avgHours[1]
        ? 'Gemini tends to estimate longer hours (more conservative).'
        : 'DeepSeek produces broader estimates (higher avg hours).',
      stability[1] >= stability[0]
        ? 'DeepSeek maintains a marginal stability advantage.'
        : 'Gemini is slightly steadier this week.',
      relevance[0] >= relevance[1]
        ? 'Gemini still leads in engineering relevance/detail.'
        : 'DeepSeek responses contain more engineering detail now.'
    ];
  }

  private prettyName(provider: string): string {
    const upper = (provider ?? '').toUpperCase();
    if (upper.includes('GEMINI')) return 'Gemini';
    if (upper.includes('DEEP')) return 'DeepSeek';
    return provider ?? '';
  }

  private computeYAxisMax(values: number[]): number {
    const data = values.filter(v => Number.isFinite(v) && v > 0);
    if (!data.length) return 1;
    const maxValue = Math.max(...data);
    return calculateYAxis(maxValue).max;
  }

  /**
   * Get complete Y-axis configuration (max and stepSize) for a dataset
   */
  private getYAxisConfig(values: number[]): { max: number; stepSize: number } {
    const data = values.filter(v => Number.isFinite(v) && v > 0);
    if (!data.length) return { max: 1, stepSize: 1 };
    const maxValue = Math.max(...data);
    return calculateYAxis(maxValue);
  }
}
