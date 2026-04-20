import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AiEstimationsService } from '../../../../services/ai/ai-estimations.service';
import { Chart, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

interface SummaryItem {
  label: string;
  value: string;
}

let summaryPluginsRegistered = false;
if (typeof window !== 'undefined' && !summaryPluginsRegistered) {
  Chart.register(ChartDataLabels);
  summaryPluginsRegistered = true;
}

@Component({
  selector: 'app-ai-summary-comparison',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-summary-comparison.component.html',
  styleUrls: ['./ai-summary-comparison.component.css']
})
export class AiSummaryComparisonComponent implements OnInit {
  isLoading = false;
  error = '';
  chartData: any;
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#111827',
        font: { weight: 'bold', size: 12 },
        formatter: value => (typeof value === 'number' ? value.toFixed(0) : value)
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        title: { display: false, text: 'Categories won' },
        ticks: { stepSize: 1 },
        grid: { color: '#e5e7eb' }
      }
    }
  };
  summaryItems: SummaryItem[] = [];

  constructor(private aiService: AiEstimationsService) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.error = '';
    this.aiService.getComparisonSummary().subscribe({
      next: raw => {
        this.summaryItems = this.buildSummaryItems(raw);
        const counts = this.buildCounts(raw);
        const axisMax = Math.max(2, Math.ceil(Math.max(counts.Gemini, counts.DeepSeek) + 2));
        this.chartData = {
          labels: ['Gemini', 'DeepSeek'],
          datasets: [
            {
              label: 'Summary categories won',
              data: [counts.Gemini, counts.DeepSeek],
              backgroundColor: ['#2563eb', '#16a34a'],
              borderRadius: 10,
              barThickness: 42,
              categoryPercentage: 0.4,
              barPercentage: 0.6
            }
          ]
        };
        this.chartOptions = {
          ...this.chartOptions,
          scales: {
            ...this.chartOptions.scales,
            y: {
              ...(this.chartOptions.scales?.['y'] as any),
              beginAtZero: true,
              min: 0,
              max: axisMax,
              title: { display: false, text: 'Categories won' },
              ticks: { stepSize: 1 },
              grid: { color: '#e5e7eb' }
            }
          }
        };
        this.isLoading = false;
      },
      error: err => {
        console.error('Summary load error', err);
        this.error = 'Failed to load comparison summary.';
        this.isLoading = false;
      }
    });
  }

  private buildCounts(summary: Record<string, unknown>): { Gemini: number; DeepSeek: number } {
    const counts = { Gemini: 0, DeepSeek: 0 };
    Object.values(summary ?? {}).forEach(value => {
      const upper = String(value ?? '').toUpperCase();
      if (upper.includes('GEMINI')) counts.Gemini += 1;
      if (upper.includes('DEEPSEEK')) counts.DeepSeek += 1;
    });
    return counts;
  }

  private buildSummaryItems(summary: Record<string, unknown>): SummaryItem[] {
    if (!summary) return [];
    return Object.keys(summary).map(key => ({
      label: this.humanizeKey(key),
      value: String(summary[key] ?? '')
    }));
  }

  private humanizeKey(key: string): string {
    const known: Record<string, string> = {
      recommendedForResearch: 'Recommended for research',
      recommendedForIndustry: 'Recommended for industry',
      bestForSpeed: 'Best for speed',
      bestForStability: 'Best for stability',
      bestForEngineeringDepth: 'Best for engineering depth'
    };
    if (known[key]) return known[key];
    const withSpaces = key.replace(/([a-z])([A-Z])/g, '$1 $2');
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
  }
}
