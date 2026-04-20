import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { AiEstimationsService } from '../../../../services/ai/ai-estimations.service';
import { Chart, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

let contentPluginsRegistered = false;
if (typeof window !== 'undefined' && !contentPluginsRegistered) {
  Chart.register(ChartDataLabels);
  contentPluginsRegistered = true;
}

@Component({
  selector: 'app-ai-content-comparison',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-content-comparison.component.html',
  styleUrls: ['./ai-content-comparison.component.css']
})
export class AiContentComparisonComponent implements OnInit {
  isLoading = false;
  error = '';
  chartData: any = null;
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#111827',
        font: { weight: 'bold', size: 12 },
        formatter: value => Number(value).toFixed(2)
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        type: 'linear',
        beginAtZero: true,
        max: 3,
        ticks: { stepSize: 1 },
        grid: { color: '#e5e7eb' },
        title: { display: false, text: 'Engineering relevance score' }
      }
    }
  };

  constructor(private aiService: AiEstimationsService) {}

  ngOnInit(): void {
    this.loadContent();
  }

  private loadContent(): void {
    this.isLoading = true;
    this.error = '';
    this.aiService.getContentQualityComparison().subscribe({
      next: raw => {
        const gem = Number(raw?.GEMINI ?? raw?.Gemini ?? 0);
        const deep = Number(raw?.DEEPSEEK ?? raw?.DeepSeek ?? 0);
        this.chartData = {
          labels: ['Gemini', 'DeepSeek'],
          datasets: [
            {
              label: 'Engineering relevance score',
              data: [gem, deep],
              backgroundColor: ['#22c55e', '#0f62fe'],
              borderRadius: 8,
              barThickness: 34,
              categoryPercentage: 0.36,
              barPercentage: 0.55
            }
          ]
        };
        this.isLoading = false;
      },
      error: err => {
        console.error('Content quality load error', err);
        this.error = 'Failed to load content-quality comparison.';
        this.isLoading = false;
      }
    });
  }
}
