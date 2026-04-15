import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AiEstimationsService } from '../../../../services/ai/ai-estimations.service';
import { Chart, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

let stabilityPluginsRegistered = false;
if (typeof window !== 'undefined' && !stabilityPluginsRegistered) {
  Chart.register(ChartDataLabels);
  stabilityPluginsRegistered = true;
}

@Component({
  selector: 'app-ai-stability-comparison',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-stability-comparison.component.html',
  styleUrls: ['./ai-stability-comparison.component.css']
})
export class AiStabilityComparisonComponent implements OnInit {
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
        formatter: value => `${Number(value).toFixed(2)}h`
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        beginAtZero: true,
        title: { display: false, text: 'Std deviation (hours)' },
        grid: { color: '#e5e7eb' }
      }
    }
  };

  constructor(private aiService: AiEstimationsService) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.error = '';
    this.aiService.getStabilityComparison().subscribe({
      next: raw => {
        const labels = Object.keys(raw ?? {}).map(v => this.prettyName(v));
        const values = Object.values(raw ?? {}).map(v => Number(v ?? 0));
        this.chartData = {
          labels,
          datasets: [
            {
              label: 'Avg std dev (hours)',
              data: values,
              backgroundColor: ['#2563eb', '#16a34a'],
              borderRadius: 10,
              barThickness: 38,
              categoryPercentage: 0.5,
              barPercentage: 0.7
            }
          ]
        };
        this.isLoading = false;
      },
      error: err => {
        console.error('Stability comparison load error', err);
        this.error = 'Failed to load stability comparison.';
        this.isLoading = false;
      }
    });
  }

  private prettyName(name: string): string {
    const upper = (name ?? '').toUpperCase();
    if (upper.includes('GEMINI')) return 'Gemini';
    if (upper.includes('DEEP')) return 'DeepSeek';
    return name ?? '';
  }
}
