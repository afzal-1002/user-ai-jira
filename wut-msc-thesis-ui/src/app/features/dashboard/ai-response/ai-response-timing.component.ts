import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiEstimationsService } from '../../../services/ai/ai-estimations.service';
import { AiResponseStatsComponent } from './ai-response-stats.component';
import { AiResponseExtremesComponent } from './ai-response-extremes.component';
@Component({
  selector: 'app-ai-response-timing',
  standalone: true,
  imports: [CommonModule, AiResponseStatsComponent, AiResponseExtremesComponent],
  templateUrl: './ai-response-timing.component.html',
  styleUrls: ['./ai-response-timing.component.css']
})
export class AiResponseTimingComponent implements OnInit {
  responseTimeStats: any = null;
  responseTimeSummary: any = null;
  activeResponseView: 'stats' | 'summary' = 'stats';
  isLoadingResponseTime = false;
  responseTimeError = '';

  // Chart.js bar chart config for avg response time
  barChartData: { labels: string[]; datasets: Array<any> } = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Avg Response Time (s)',
        backgroundColor: '#1976d2',
        borderRadius: 8,
        maxBarThickness: 40
      }
    ]
  };
  barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
        text: 'Average Response Time',
        font: { size: 14, weight: 'bold' }
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'end' as const,
        color: '#222',
        font: { weight: 'bold' as const, size: 13 },
        formatter: function(value: any) {
          if (typeof value === 'number') {
            return value.toFixed(2);
          }
          return value;
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { weight: 'bold' as const, size: 11 } },
        title: { display: false, text: 'AI Provider', font: { weight: 'bold' as const, size: 12 } }
      },
      y: {
        beginAtZero: true,
        max: undefined as number | undefined,
        grid: { color: '#eee' },
        ticks: { 
          font: { weight: 'bold' as const, size: 11 },
          stepSize: 1
        },
        title: { display: false, text: 'Response Time (s)', font: { weight: 'bold' as const, size: 12 } }
      }
    }
  };
  barChartType = 'bar';

  // Grouped bar chart for min/max/stddev (box plot alternative)
  boxChartData: { labels: string[]; datasets: Array<any> } = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Min',
        backgroundColor: '#43a047',
        borderRadius: 8,
        maxBarThickness: 30
      },
      {
        data: [],
        label: 'Max',
        backgroundColor: '#e53935',
        borderRadius: 8,
        maxBarThickness: 30
      },
      {
        data: [],
        label: 'StdDev',
        backgroundColor: '#fbc02d',
        borderRadius: 8,
        maxBarThickness: 30
      }
    ]
  };
  boxChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        labels: { font: { weight: 'bold' as const, size: 11 } }
      },
      title: {
        display: false,
        text: 'Response Time Statistics (Min/Max/StdDev)',
        font: { size: 14, weight: 'bold' as const }
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'end' as const,
        color: '#222',
        font: { weight: 'bold' as const, size: 13 },
        formatter: function(value: any) {
          if (typeof value === 'number') {
            return value.toFixed(2);
          }
          return value;
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { weight: 'bold' as const, size: 11 } },
        title: { display: false, text: 'AI Provider', font: { weight: 'bold' as const, size: 12 } }
      },
      y: {
        beginAtZero: true,
        max: undefined as number | undefined,
        grid: { color: '#eee' },
        ticks: { 
          font: { weight: 'bold' as const, size: 11 },
          stepSize: 1
        },
        title: { display: false, text: 'Time (s)', font: { weight: 'bold' as const, size: 12 } }
      }
    }
  };
  boxChartType = 'bar';

  // Radar chart for multi-metric comparison
  radarChartData: { labels: string[]; datasets: Array<any> } = {
    labels: ['Avg', 'Min', 'Max', 'StdDev'],
    datasets: []
  };
  radarChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        labels: { font: { weight: 'bold' as const, size: 11 } }
      },
      title: {
        display: false,
        text: 'Multi-Metric Response Analysis',
        font: { size: 14, weight: 'bold' as const }
      },
      datalabels: {
        color: '#222',
        font: { weight: 'bold' as const, size: 13 },
        formatter: function(value: any) {
          if (typeof value === 'number') {
            return value.toFixed(2);
          }
          return value;
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: { font: { weight: 'bold' as const, size: 10 } }
      }
    }
  };
  radarChartType = 'radar';

  // Line chart placeholder (requires time series data)
  lineChartData: { labels: string[]; datasets: Array<any> } = {
    labels: [],
    datasets: []
  };
  lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        labels: { font: { weight: 'bold' as const, size: 11 } }
      },
      title: {
        display: false,
        text: 'Response Time Trends',
        font: { size: 14, weight: 'bold' as const }
      },
      datalabels: {
        font: { weight: 'bold' as const, size: 11 }
      }
    },
    scales: {
      x: {
        ticks: { font: { weight: 'bold' as const, size: 11 } },
        title: { display: false, text: 'Time', font: { weight: 'bold' as const, size: 12 } }
      },
      y: {
        ticks: { font: { weight: 'bold' as const, size: 11 } },
        title: { display: false, text: 'Response Time (s)', font: { weight: 'bold' as const, size: 12 } }
      }
    }
  };
  lineChartType = 'line';

  constructor(private aiService: AiEstimationsService) {}

  ngOnInit(): void {
    this.setActiveResponseView('stats');
  }

  setActiveResponseView(view: 'stats' | 'summary'): void {
    if (this.activeResponseView === view) {
      const hasStats = view === 'stats' && this.responseTimeStats;
      const hasSummary = view === 'summary' && this.responseTimeSummary;
      if (hasStats || hasSummary) {
        return;
      }
    }
    this.activeResponseView = view;
    if (view === 'stats') {
      this.loadResponseTimeStats();
    } else if (view === 'summary') {
      this.loadResponseTimeSummary();
    }
  }

  loadResponseTimeStats(): void {
    if (this.responseTimeStats && !this.responseTimeError) {
      return;
    }
    this.isLoadingResponseTime = true;
    this.responseTimeError = '';
    this.aiService.getResponseTimeStats().subscribe({
      next: raw => {
        this.responseTimeStats = raw;
        // Update bar chart data
        this.barChartData.labels = raw.map((stat: any) => stat.aiProvider);
        const avgValues = raw.map((stat: any) => stat.avgResponseTimeSec);
        this.barChartData.datasets[0].data = avgValues;
        
        // Calculate Y-axis max: round up to next integer + 1
        const maxValue = Math.max(...avgValues);
        this.barChartOptions.scales.y.max = Math.ceil(maxValue) + 1;
        
        // Update box plot (grouped bar) data
        this.boxChartData.labels = raw.map((stat: any) => stat.aiProvider);
        this.boxChartData.datasets[0].data = raw.map((stat: any) => stat.minResponseTimeSec);
        this.boxChartData.datasets[1].data = raw.map((stat: any) => stat.maxResponseTimeSec);
        this.boxChartData.datasets[2].data = raw.map((stat: any) => stat.stdDeviationSec);
        
        // Calculate Y-axis max for box chart
        const boxValues = [...this.boxChartData.datasets[0].data, ...this.boxChartData.datasets[1].data, ...this.boxChartData.datasets[2].data];
        const boxMaxValue = Math.max(...boxValues);
        this.boxChartOptions.scales.y.max = Math.ceil(boxMaxValue) + 1;
        
        // Radar chart: one dataset per model
        this.radarChartData.datasets = raw.map((stat: any, idx: number) => ({
          label: stat.aiProvider,
          data: [stat.avgResponseTimeSec, stat.minResponseTimeSec, stat.maxResponseTimeSec, stat.stdDeviationSec],
          fill: true,
          backgroundColor: `rgba(${60+idx*80},${120+idx*40},229,0.18)`,
          borderColor: `rgba(${60+idx*80},${120+idx*40},229,0.8)`
        }));
        // Line chart: placeholder (requires time series data)
        this.lineChartData.labels = [];
        this.lineChartData.datasets = [];
        this.isLoadingResponseTime = false;
      },
      error: err => {
        console.error('Response-time stats load error', err);
        this.responseTimeError = 'Failed to load response-time statistics.';
        this.isLoadingResponseTime = false;
      }
    });
  }

  loadResponseTimeSummary(): void {
    if (this.responseTimeSummary && !this.responseTimeError) {
      return;
    }
    this.isLoadingResponseTime = true;
    this.responseTimeError = '';
    this.aiService.getResponseTimeSummary().subscribe({
      next: raw => {
        this.responseTimeSummary = raw;
        this.isLoadingResponseTime = false;
      },
      error: err => {
        console.error('Response-time summary load error', err);
        this.responseTimeError = 'Failed to load fastest vs slowest summary.';
        this.isLoadingResponseTime = false;
      }
    });
  }

  get maxResponseTimeStat(): number {
    if (!this.responseTimeStats || !Array.isArray(this.responseTimeStats)) {
      return 0;
    }
    let max = 0;
    for (const stat of this.responseTimeStats) {
      max = Math.max(
        max,
        stat.avgResponseTimeSec || 0,
        stat.minResponseTimeSec || 0,
        stat.maxResponseTimeSec || 0,
        stat.stdDeviationSec || 0
      );
    }
    return max;
  }
}
