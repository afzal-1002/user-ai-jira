import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartEvent, ActiveElement } from 'chart.js';
import { HistoryService } from '../../services/history.service';
import { StabilityHistoryResult, StabilityVarianceChartData, StabilityIndexData, StabilityRadarData, StabilityScatterPoint } from '../../models/history.models';

type ChartView = 'dualbar' | 'radar' | 'index' | 'scatter';

@Component({
  selector: 'app-stability-variance',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './stability-variance.component.html',
  styleUrls: ['./stability-variance.component.scss']
})
export class StabilityVarianceComponent implements OnInit {
  isLoading = false;
  error = '';
  results: StabilityHistoryResult[] = [];
  
  // Expose Math to template
  Math = Math;
  
  activeView: ChartView = 'dualbar';
  
  dualBarChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  dualBarChartOptions: ChartConfiguration<'bar'>['options'] = {};
  
  radarChartData: ChartConfiguration<'radar'>['data'] = { labels: [], datasets: [] };
  radarChartOptions: ChartConfiguration<'radar'>['options'] = {};
  
  stabilityIndexChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  stabilityIndexChartOptions: ChartConfiguration<'bar'>['options'] = {};
  
  scatterChartData: ChartConfiguration<'scatter'>['data'] = { labels: [], datasets: [] };
  scatterChartOptions: ChartConfiguration<'scatter'>['options'] = {};

  stabilityVarianceData: StabilityVarianceChartData[] = [];
  stabilityIndexData: StabilityIndexData[] = [];
  stabilityRadarData: StabilityRadarData[] = [];
  stabilityScatterData: StabilityScatterPoint[] = [];

  constructor(private historyService: HistoryService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.historyService.getStability().subscribe({
      next: (data) => {
        this.results = data || [];
        this.processData();
        this.initDualBarChart();
        this.initRadarChart();
        this.initStabilityIndexChart();
        this.initScatterChart();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load stability history', err);
        this.error = 'Failed to load stability history.';
        this.isLoading = false;
      }
    });
  }

  processData(): void {
    this.stabilityVarianceData = this.historyService.processStabilityVariance(this.results);
    this.stabilityIndexData = this.historyService.processStabilityIndex(this.results);
    this.stabilityRadarData = this.historyService.processStabilityRadar(this.results);
    this.stabilityScatterData = this.historyService.processStabilityScatter(this.results);
  }

  setActiveView(view: ChartView): void {
    this.activeView = view;
  }

  initDualBarChart(): void {
    const estData = this.stabilityVarianceData.map(d => Math.round(d.estimationVariance * 100) / 100);
    const respData = this.stabilityVarianceData.map(d => Math.round(d.responseTimeVariance * 100) / 100);
    const allValues = [...estData, ...respData];
    const maxValue = Math.max(...allValues);
    const roundedMax = maxValue < 1 ? Math.ceil(maxValue * 10) / 10 : Math.round(maxValue);
    const increment = maxValue < 1 ? maxValue : 2;
    const axisMax = roundedMax + increment;

    this.dualBarChartData = {
      labels: this.stabilityVarianceData.map(d => d.provider),
      datasets: [
        {
          label: 'Estimation Variance (Hours)',
          data: estData,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.35,
          categoryPercentage: 0.5
        },
        {
          label: 'Response Time Variance (Seconds)',
          data: respData,
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          borderRadius: 5,
          barPercentage: 0.35,
          categoryPercentage: 0.5
        }
      ]
    };

    this.dualBarChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 15, font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          callbacks: {
            label: (context) => {
              const value = typeof context.parsed.y === 'number' ? context.parsed.y.toFixed(2) : context.parsed.y;
              return `${context.dataset.label}: ${value}`;
            }
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'top',
          font: { weight: 'bold', size: 11 },
          formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: axisMax,
          ticks: { font: { size: 11 } },
          title: { display: false, text: 'Variance Value', font: { size: 12, weight: 'bold' } }
        },
        x: {
          ticks: { font: { size: 12, weight: 'bold' } }
        }
      }
    };
  }

  initRadarChart(): void {
    this.radarChartData = {
      labels: ['Estimation Stability', 'Response Time Stability'],
      datasets: this.stabilityRadarData.map((item, idx) => ({
        label: item.provider,
        data: [item.estimationStability, item.responseTimeStability],
        borderColor: idx === 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(75, 192, 192, 1)',
        backgroundColor: idx === 0 ? 'rgba(54, 162, 235, 0.2)' : 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: idx === 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }))
    };

    this.radarChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 15, font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          callbacks: {
            label: (context) => {
              return `${context.dataset.label}: ${context.parsed.r.toFixed(2)}/10`;
            }
          }
        }
      },
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2, font: { size: 11 } },
          pointLabels: { font: { size: 12, weight: 'bold' } }
        }
      }
    };
  }

  initStabilityIndexChart(): void {
    const indexData = this.stabilityIndexData.map(d => Math.round(d.stabilityIndex * 10000) / 10000);

    this.stabilityIndexChartData = {
      labels: this.stabilityIndexData.map(d => d.provider),
      datasets: [
        {
          label: 'Stability Index (1/Total Variance)',
          data: indexData,
          backgroundColor: [
            'rgba(139, 0, 0, 0.8)',
            'rgba(0, 100, 100, 0.8)',
            'rgba(184, 134, 11, 0.8)',
            'rgba(75, 0, 130, 0.8)'
          ],
          borderColor: [
            'rgba(139, 0, 0, 1)',
            'rgba(0, 100, 100, 1)',
            'rgba(184, 134, 11, 1)',
            'rgba(75, 0, 130, 1)'
          ],
          borderWidth: 2,
          borderRadius: 8
        }
      ]
    };

    this.stabilityIndexChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y' as const,
      plugins: {
        legend: {
          display: false,
          position: 'bottom',
          labels: { padding: 15, font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          callbacks: {
            label: (context) => `Stability Index: ${context.parsed.x.toFixed(4)}`
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'right',
          font: { weight: 'bold', size: 11 },
          formatter: (value: any) => (typeof value === 'number' ? value.toFixed(4) : value)
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 0.035,
          ticks: { font: { size: 11 } },
          title: { display: false, text: 'Stability Index (Higher = More Stable)', font: { size: 12, weight: 'bold' } }
        },
        y: {
          ticks: { font: { size: 12, weight: 'bold' } }
        }
      }
    };
  }

  initScatterChart(): void {
    const scatterPoints = this.stabilityScatterData.map((item, idx) => ({
      x: item.estimationVariance,
      y: item.responseTimeVariance,
      label: item.provider,
      color: idx === 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(75, 192, 192, 1)'
    }));

    this.scatterChartData = {
      datasets: scatterPoints.map(point => ({
        label: point.label,
        data: [{ x: point.x, y: point.y }],
        backgroundColor: point.color,
        pointRadius: 10,
        pointHoverRadius: 12,
        borderColor: '#fff',
        borderWidth: 2
      }))
    };

    this.scatterChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 15, font: { size: 13 } }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 12,
          callbacks: {
            label: (context) => {
              const point = context.raw as any;
              return `Est. Var: ${point.x.toFixed(2)}h, Resp. Var: ${point.y.toFixed(2)}s`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear' as const,
          position: 'bottom' as const,
          min: 0,
          ticks: { font: { size: 11 } },
          title: { display: false, text: 'Estimation Variance (Hours)', font: { size: 12, weight: 'bold' } }
        },
        y: {
          min: 0,
          ticks: { font: { size: 11 } },
          title: { display: false, text: 'Response Time Variance (Seconds)', font: { size: 12, weight: 'bold' } }
        }
      }
    };
  }

  getStabilityLabel(index: number): string {
    const stabilityIndex = this.stabilityIndexData[index]?.stabilityIndex || 0;
    if (stabilityIndex > 0.15) return 'Very Stable';
    if (stabilityIndex > 0.08) return 'Stable';
    if (stabilityIndex > 0.02) return 'Moderate';
    return 'Unstable';
  }

  getStabilityBadgeClass(index: number): string {
    const stabilityIndex = this.stabilityIndexData[index]?.stabilityIndex || 0;
    if (stabilityIndex > 0.15) return 'bg-success';
    if (stabilityIndex > 0.08) return 'bg-info';
    if (stabilityIndex > 0.02) return 'bg-warning';
    return 'bg-danger';
  }
}
