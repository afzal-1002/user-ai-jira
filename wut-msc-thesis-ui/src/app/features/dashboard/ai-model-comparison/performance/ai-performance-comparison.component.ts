import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AiEstimationsService } from '../../../../services/ai/ai-estimations.service';
import { ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';

let performancePluginsRegistered = false;
if (typeof window !== 'undefined' && !performancePluginsRegistered) {
  Chart.register(ChartDataLabels);
  performancePluginsRegistered = true;
}

@Component({
  selector: 'app-ai-performance-comparison',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-performance-comparison.component.html',
  styleUrls: ['./ai-performance-comparison.component.css']
})
export class AiPerformanceComparisonComponent implements OnInit {
  isLoading = false;
  error = '';
  chartData: any = null;
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
        text: 'AI Model Performance Comparison',
        font: { size: 14, weight: 'bold' }
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#111827',
        font: { weight: 'bold', size: 12 },
        formatter: value => (typeof value === 'number' ? `${value.toFixed(2)}s` : value)
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { weight: 'bold', size: 11 } },
        title: { display: false, text: 'AI Model', font: { weight: 'bold', size: 12 } }
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: { font: { weight: 'bold', size: 11 } },
        title: { display: false, text: 'Response time (s)', font: { weight: 'bold', size: 12 } }
      }
    }
  };

  constructor(private aiService: AiEstimationsService) {}

  ngOnInit(): void {
    this.loadPerformance();
  }

  private loadPerformance(): void {
    this.isLoading = true;
    this.error = '';
    this.aiService.getFullModelComparison().subscribe({
      next: raw => {
        const labels = raw.map((m: any) => this.prettyName(m.aiProvider));
        const avg = raw.map((m: any) => Number(m.avgResponseTimeSec ?? 0));
        this.chartData = {
          labels,
          datasets: [
            {
              label: 'Avg response time (s)',
              data: avg,
              backgroundColor: ['#2563eb', '#16a34a'],
              borderRadius: 10,
              barThickness: 42,
              categoryPercentage: 0.28,
              barPercentage: 0.45
            }
          ]
        };
        this.isLoading = false;
      },
      error: err => {
        console.error('Performance comparison load error', err);
        this.error = 'Failed to load performance comparison.';
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
