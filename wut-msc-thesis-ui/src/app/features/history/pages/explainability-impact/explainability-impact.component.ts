import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HistoryService } from '../../services/history.service';
import { ExplainabilityHistoryResult } from '../../models/history.models';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

type ChartView = 'grouped' | 'overhead' | 'sidebyside' | 'radar';

@Component({
  selector: 'app-explainability-impact',
  standalone: true,
  imports: [CommonModule, NgChartsModule, DecimalPipe],
  templateUrl: './explainability-impact.component.html',
  styleUrls: ['./explainability-impact.component.scss']
})
export class ExplainabilityImpactComponent implements OnInit {
  isLoading = false;
  error = '';
  results: ExplainabilityHistoryResult[] = [];
  activeView: ChartView = 'grouped';
  
  // Chart configs
  responseTimeChartConfig: ChartConfiguration = { type: 'bar', data: {} as ChartData };
  overheadChartConfig: ChartConfiguration = { type: 'bar', data: {} as ChartData };
  sideBySideDisabledChartConfig: ChartConfiguration = { type: 'bar', data: {} as ChartData };
  sideBySideEnabledChartConfig: ChartConfiguration = { type: 'bar', data: {} as ChartData };
  radarChartConfig: ChartConfiguration = { type: 'radar', data: {} as ChartData };
  
  // Processed data
  chartData: any[] = [];

  constructor(private historyService: HistoryService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.historyService.getExplainabilityImpact().subscribe({
      next: (data) => {
        this.results = data || [];
        this.processCharts();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load explainability impact history', err);
        this.error = 'Failed to load explainability impact history.';
        this.isLoading = false;
      }
    });
  }

  setActiveView(view: ChartView): void {
    this.activeView = view;
  }

  private processCharts(): void {
    this.chartData = this.historyService.processExplainabilityImpactByProvider(this.results);
    this.initResponseTimeChart();
    this.initOverheadChart();
    this.initSideBySideCharts();
    this.initRadarChart();
  }

  private initResponseTimeChart(): void {
    // PRIMARY CHART: Grouped Bar - Explanation Disabled vs Enabled
    const providers = this.chartData.map(d => d.provider);
    const withExplanation = this.chartData.map(d => d.withExplanation);
    const withoutExplanation = this.chartData.map(d => d.withoutExplanation);
    
    // Calculate axis padding with intelligent rounding
    const allValues = [...withExplanation, ...withoutExplanation];
    const maxValue = Math.max(...allValues);
    const roundedMax = maxValue < 1 ? Math.ceil(maxValue * 10) / 10 : Math.round(maxValue);
    const increment = maxValue < 1 ? maxValue : 2;
    const axisMax = roundedMax + increment;

    this.responseTimeChartConfig = {
      type: 'bar',
      data: {
        labels: providers,
        datasets: [
          {
            label: 'Explanation Disabled',
            data: withoutExplanation,
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 2,
            borderRadius: 4,
            barPercentage: 0.35,
            categoryPercentage: 0.5
          },
          {
            label: 'Explanation Enabled',
            data: withExplanation,
            backgroundColor: '#3b82f6',
            borderColor: '#1e40af',
            borderWidth: 2,
            borderRadius: 4,
            barPercentage: 0.35,
            categoryPercentage: 0.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'x',
        plugins: {
          legend: { display: false, position: 'top' },
          title: { display: false },
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
            ticks: {
              callback: function(value) {
                return (value as number).toFixed(1) + 's';
              }
            },
            title: {
              display: false,
              text: 'Response Time (seconds)',
              font: { size: 12 }
            }
          },
          x: {
            title: {
              display: false,
              text: 'AI Provider',
              font: { size: 12 }
            }
          }
        }
      }
    };
  }

  private initOverheadChart(): void {
    // SECONDARY CHART: Overhead Delta Cost
    const providers = this.chartData.map(d => d.provider);
    const overhead = this.chartData.map(d => Math.round(d.overheadDelta * 1000) / 1000);
    const colors = ['#f59e0b', '#ec4899'];
    
    // Calculate axis padding with intelligent rounding
    const maxValue = Math.max(...overhead);
    const roundedMax = maxValue < 1 ? Math.ceil(maxValue * 10) / 10 : Math.round(maxValue);
    const increment = maxValue < 1 ? maxValue : 2;
    const axisMax = roundedMax + increment;

    this.overheadChartConfig = {
      type: 'bar',
      data: {
        labels: providers,
        datasets: [
          {
            label: 'Explainability Overhead (seconds)',
            data: overhead,
            backgroundColor: colors,
            borderColor: ['#d97706', '#be185d'],
            borderWidth: 2,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'x',
        plugins: {
          legend: { display: false },
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
            ticks: {
              callback: function(value) {
                return (value as number).toFixed(2) + 's';
              }
            },
            title: {
              display: false,
              text: 'Additional Response Time (seconds)',
              font: { size: 12 }
            }
          },
          x: {
            title: {
              display: false,
              text: 'AI Provider',
              font: { size: 12 }
            }
          }
        }
      }
    };
  }

  private initSideBySideCharts(): void {
    // TERTIARY CHART: Side-by-side comparison
    const providers = this.chartData.map(d => d.provider);
    const disabledTimes = this.chartData.map(d => Math.round(d.withoutExplanation * 100) / 100);
    const enabledTimes = this.chartData.map(d => Math.round(d.withExplanation * 100) / 100);

    // Explanation Disabled
    const disabledMaxValue = Math.max(...disabledTimes);
    const disabledRoundedMax = disabledMaxValue < 1 ? Math.ceil(disabledMaxValue * 10) / 10 : Math.round(disabledMaxValue);
    const disabledIncrement = disabledMaxValue < 1 ? disabledMaxValue : 2;
    const disabledAxisMax = disabledRoundedMax + disabledIncrement;
    
    this.sideBySideDisabledChartConfig = {
      type: 'bar',
      data: {
        labels: providers,
        datasets: [
          {
            label: 'Response Time (Explanation Disabled)',
            data: disabledTimes,
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
            borderWidth: 2,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
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
            max: disabledAxisMax,
            ticks: {
              callback: function(value) {
                return (value as number).toFixed(1) + 's';
              }
            },
            title: {
              display: false,
              text: 'Response Time (seconds)',
              font: { size: 11 }
            }
          }
        }
      }
    };

    // Explanation Enabled
    const enabledMaxValue = Math.max(...enabledTimes);
    const enabledRoundedMax = enabledMaxValue < 1 ? Math.ceil(enabledMaxValue * 10) / 10 : Math.round(enabledMaxValue);
    const enabledIncrement = enabledMaxValue < 1 ? enabledMaxValue : 2;
    const enabledAxisMax = enabledRoundedMax + enabledIncrement;
    
    this.sideBySideEnabledChartConfig = {
      type: 'bar',
      data: {
        labels: providers,
        datasets: [
          {
            label: 'Response Time (Explanation Enabled)',
            data: enabledTimes,
            backgroundColor: '#3b82f6',
            borderColor: '#1e40af',
            borderWidth: 2,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
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
            max: enabledAxisMax,
            ticks: {
              callback: function(value) {
                return (value as number).toFixed(1) + 's';
              }
            },
            title: {
              display: false,
              text: 'Response Time (seconds)',
              font: { size: 11 }
            }
          }
        }
      }
    };
  }

  private initRadarChart(): void {
    // OPTIONAL CHART: Radar - Multi-axis performance view
    const providers = this.chartData.map(d => d.provider);
    
    // Normalize values to 0-10 scale
    const maxTime = Math.max(...this.chartData.map(d => Math.max(d.withExplanation, d.withoutExplanation)));
    const disabledNormalized = this.chartData.map(d => (d.withoutExplanation / maxTime) * 10);
    const enabledNormalized = this.chartData.map(d => (d.withExplanation / maxTime) * 10);

    this.radarChartConfig = {
      type: 'radar',
      data: {
        labels: providers,
        datasets: [
          {
            label: 'Explanation Disabled',
            data: disabledNormalized,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 2
          },
          {
            label: 'Explanation Enabled',
            data: enabledNormalized,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false, position: 'top' }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 10,
            ticks: {
              stepSize: 2
            },
            title: {
              display: false,
              text: 'Performance (Normalized)',
              font: { size: 11 }
            }
          }
        }
      }
    };
  }

  goBack(): void {
    this.router.navigate(['/history']);
  }
}
