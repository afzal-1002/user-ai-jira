import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AiEstimationsService } from '../../../../services/ai/ai-estimations.service';
import { Chart, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

let estimationPluginsRegistered = false;
if (typeof window !== 'undefined' && !estimationPluginsRegistered) {
  Chart.register(ChartDataLabels);
  estimationPluginsRegistered = true;
}

@Component({
  selector: 'app-ai-estimation-comparison',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-estimation-comparison.component.html',
  styleUrls: ['./ai-estimation-comparison.component.css']
})
export class AiEstimationComparisonComponent implements OnInit {
  isLoading = false;
  error = '';
  chartData: any = null;
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
        text: 'AI Model Estimation Comparison',
        font: { size: 14, weight: 'bold' }
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#111827',
        font: { weight: 'bold', size: 12 },
        formatter: value => (typeof value === 'number' ? `${value.toFixed(2)}h` : value)
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
        title: { display: false, text: 'Estimated hours', font: { weight: 'bold', size: 12 } }
      }
    }
  };

  constructor(private aiService: AiEstimationsService) {}

  ngOnInit(): void {
    this.loadEstimation();
  }

  private loadEstimation(): void {
    this.isLoading = true;
    this.error = '';
    this.aiService.getEstimationComparison().subscribe({
      next: raw => {
        const labels = Object.keys(raw ?? {}).map(name => this.prettyName(name));
        const values = Object.values(raw ?? {}).map(val => Number(val ?? 0));
        this.chartData = {
          labels,
          datasets: [
            {
              label: 'Avg estimated hours',
              data: values,
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
        console.error('Estimation comparison load error', err);
        this.error = 'Failed to load estimation comparison.';
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
