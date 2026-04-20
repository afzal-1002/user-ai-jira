import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HistoryService } from '../../services/history.service';
import {
  AIHistoryResult,
  EstimationComparisonData,
  StabilityOverTimeData,
  PerformanceMetricsData,
  ExplanationImpactData,
  PromptImpactData,
  UsageDistributionData,
  FrequencyHeatmapData
} from '../../models/history.models';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { EstimationHistoryTableComponent } from '../../estimation-history-table.component';

@Component({
  selector: 'app-estimation-history',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule, EstimationHistoryTableComponent],
  templateUrl: './estimation-history.component.html',
  styleUrls: ['./estimation-history.component.scss']
})
export class EstimationHistoryComponent implements OnInit {
  isLoading = false;
  error = '';
  estimations: AIHistoryResult[] = [];
  allIssues: string[] = [];
  selectedIssue = '';
  selectedProvider = '';

  // Chart Data
  estimationComparisonData: EstimationComparisonData[] = [];
  stabilityOverTimeData: StabilityOverTimeData[] = [];
  performanceMetricsData: PerformanceMetricsData[] = [];
  explanationImpactData: ExplanationImpactData[] = [];
  promptImpactData: PromptImpactData[] = [];
  usageDistributionData: UsageDistributionData[] = [];
  frequencyHeatmapData: FrequencyHeatmapData[] = [];

  // Chart Configurations
  estimationComparisonChartConfig: ChartConfiguration = { type: 'bar', data: {} as ChartData };
  stabilityOverTimeChartConfig: ChartConfiguration = { type: 'line', data: {} as ChartData };
  performanceChartConfig: ChartConfiguration = { type: 'bar', data: {} as ChartData };
  explanationImpactChartConfig: ChartConfiguration = { type: 'bar', data: {} as ChartData };
  promptImpactChartConfig: ChartConfiguration = { type: 'bar', data: {} as ChartData };
  usageDistributionChartConfig: ChartConfiguration = { type: 'doughnut', data: {} as ChartData };
  frequencyHeatmapChartConfig: ChartConfiguration = { type: 'bubble', data: {} as ChartData };

  constructor(private historyService: HistoryService, private router: Router) {}

  ngOnInit(): void {
    this.loadEstimations();
  }

  loadEstimations(): void {
    this.isLoading = true;
    this.error = '';
    this.historyService.getEstimations().subscribe({
      next: (data) => {
        this.estimations = data || [];
        this.extractIssues();
        this.processChartData(data);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load estimation history', err);
        this.error = 'Failed to load estimation history.';
        this.isLoading = false;
      }
    });
  }

  private extractIssues(): void {
    const issuesSet = new Set(this.estimations.map(e => e.issueKey));
    this.allIssues = Array.from(issuesSet).sort();
  }

  filterData(): void {
    let filtered = this.estimations;
    if (this.selectedIssue) {
      filtered = filtered.filter(e => e.issueKey === this.selectedIssue);
    }
    if (this.selectedProvider) {
      filtered = filtered.filter(e => e.aiProvider === this.selectedProvider);
    }
    this.processChartData(filtered);
  }

  private processChartData(data: AIHistoryResult[]): void {
    // Chart 1: Estimation Comparison
    this.estimationComparisonData = this.historyService.processEstimationComparison(data);
    this.initEstimationComparisonChart();

    // Chart 2: Stability Over Time
    this.stabilityOverTimeData = this.historyService.processStabilityOverTime(data);
    this.initStabilityOverTimeChart();

    // Chart 3: Performance Metrics
    this.performanceMetricsData = this.historyService.processPerformanceMetrics(data);
    this.initPerformanceChart();

    // Chart 4: Explanation Impact
    this.explanationImpactData = this.historyService.processExplanationImpact(data);
    this.initExplanationImpactChart();

    // Chart 5: Prompt Impact
    this.promptImpactData = this.historyService.processPromptImpact(data);
    this.initPromptImpactChart();

    // Chart 6: Usage Distribution
    this.usageDistributionData = this.historyService.processUsageDistribution(data);
    this.initUsageDistributionChart();

    // Chart 7: Frequency Heatmap
    this.frequencyHeatmapData = this.historyService.processFrequencyHeatmap(data);
    this.initFrequencyHeatmapChart();
  }

  private initEstimationComparisonChart(): void {
    const data = this.estimationComparisonData.map(d => Math.round(d.avgEstimation * 100) / 100);
    const maxValue = Math.max(...data);
    const axisMax = this.computeYAxisMaxWithIncrements([maxValue]);
    
    // Define colors for different providers
    const colorMap: { [key: string]: string } = {
      'GEMINI': '#3b82f6',
      'DeepSeek': '#f97316',
      'DEEPSEEK': '#f97316'
    };
    
    const colors = this.estimationComparisonData.map(d => colorMap[d.provider] || '#8b5cf6');
    
    this.estimationComparisonChartConfig = {
      type: 'bar',
      data: {
        labels: this.estimationComparisonData.map(d => d.provider),
        datasets: [
          {
            label: 'Average Estimation (hours)',
            data: data,
            backgroundColor: colors,
            borderColor: colors.map(c => this.darkenColor(c, 0.2)),
            borderWidth: 1,
            barPercentage: 0.35,
            categoryPercentage: 0.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          title: {
            display: false,
            text: '📊 Estimation Comparison by Model',
            font: { size: 16, weight: 'bold' }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 12 },
            formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
          }
        },
        scales: {
          x: {
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'AI Provider', font: { weight: 'bold', size: 12 } }
          },
          y: {
            beginAtZero: true,
            max: axisMax,
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'Hours', font: { weight: 'bold', size: 12 } }
          }
        }
      }
    };
  }

  private initStabilityOverTimeChart(): void {
    const geminiData = this.stabilityOverTimeData.map(d => d.geminiEstimation || null);
    const deepseekData = this.stabilityOverTimeData.map(d => d.deepseekEstimation || null);
    
    this.stabilityOverTimeChartConfig = {
      type: 'line',
      data: {
        labels: this.stabilityOverTimeData.map(d => d.date),
        datasets: [
          {
            label: 'GEMINI',
            data: geminiData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2
          },
          {
            label: 'DEEPSEEK',
            data: deepseekData,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
            labels: { font: { weight: 'bold', size: 11 } }
          },
          title: {
            display: false,
            text: '📈 Estimation Stability Over Time',
            font: { size: 16, weight: 'bold' }
          },
          datalabels: {
            font: { weight: 'bold', size: 10 }
          }
        },
        scales: {
          x: {
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'Date', font: { weight: 'bold', size: 12 } }
          },
          y: {
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'Hours', font: { weight: 'bold', size: 12 } }
          }
        }
      }
    };
  }

  private initPerformanceChart(): void {
    const data = this.performanceMetricsData.map(d => Math.round(d.avgAnalysisTime * 100) / 100);
    const maxValue = Math.max(...data);
    const axisMax = this.computeYAxisMaxWithIncrements([maxValue]);
    
    // Define colors for different providers
    const colorMap: { [key: string]: string } = {
      'GEMINI': '#8b5cf6',
      'DeepSeek': '#f97316',
      'DEEPSEEK': '#f97316'
    };
    
    const colors = this.performanceMetricsData.map(d => colorMap[d.provider] || '#06b6d4');
    
    this.performanceChartConfig = {
      type: 'bar',
      data: {
        labels: this.performanceMetricsData.map(d => d.provider),
        datasets: [
          {
            label: 'Avg Analysis Time (sec)',
            data: data,
            backgroundColor: colors,
            borderColor: colors.map(c => this.darkenColor(c, 0.2)),
            borderWidth: 1,
            barPercentage: 0.35,
            categoryPercentage: 0.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          title: {
            display: false,
            text: '⚡ Analysis Time Comparison',
            font: { size: 16, weight: 'bold' }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 12 },
            formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
          }
        },
        scales: {
          x: {
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'AI Provider', font: { weight: 'bold', size: 12 } }
          },
          y: {
            beginAtZero: true,
            max: axisMax,
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'Seconds', font: { weight: 'bold', size: 12 } }
          }
        }
      }
    };
  }

  private initExplanationImpactChart(): void {
    const groupedByProvider = new Map<string, any>();
    
    this.explanationImpactData.forEach(item => {
      if (!groupedByProvider.has(item.provider)) {
        groupedByProvider.set(item.provider, { with: 0, without: 0 });
      }
      const group = groupedByProvider.get(item.provider);
      if (item.explanationEnabled) {
        group.with = Math.round(item.avgEstimation * 100) / 100;
      } else {
        group.without = Math.round(item.avgEstimation * 100) / 100;
      }
    });

    const providers = Array.from(groupedByProvider.keys());
    const withExplanation = providers.map(p => groupedByProvider.get(p).with);
    const withoutExplanation = providers.map(p => groupedByProvider.get(p).without);
    
    const allValues = [...withExplanation, ...withoutExplanation];
    const maxValue = Math.max(...allValues);
    const axisMax = this.computeYAxisMaxWithIncrements(allValues);

    this.explanationImpactChartConfig = {
      type: 'bar',
      data: {
        labels: providers,
        datasets: [
          {
            label: 'With Explanation',
            data: withExplanation,
            backgroundColor: '#10b981',
            barPercentage: 0.35,
            categoryPercentage: 0.5
          },
          {
            label: 'Without Explanation',
            data: withoutExplanation,
            backgroundColor: '#f59e0b',
            barPercentage: 0.35,
            categoryPercentage: 0.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
            labels: { font: { weight: 'bold', size: 11 } }
          },
          title: {
            display: false,
            text: '💡 Explanation Impact on Estimation',
            font: { size: 16, weight: 'bold' }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 12 },
            formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
          }
        },
        scales: {
          x: {
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'AI Provider', font: { weight: 'bold', size: 12 } }
          },
          y: {
            beginAtZero: true,
            max: axisMax,
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'Hours', font: { weight: 'bold', size: 12 } }
          }
        }
      }
    };
  }

  private initPromptImpactChart(): void {
    const groupedByProvider = new Map<string, any>();
    
    this.promptImpactData.forEach(item => {
      if (!groupedByProvider.has(item.provider)) {
        groupedByProvider.set(item.provider, { with: 0, without: 0 });
      }
      const group = groupedByProvider.get(item.provider);
      if (item.promptProvided) {
        group.with = Math.round(item.avgEstimation * 100) / 100;
      } else {
        group.without = Math.round(item.avgEstimation * 100) / 100;
      }
    });

    const providers = Array.from(groupedByProvider.keys());
    const withPrompt = providers.map(p => groupedByProvider.get(p).with);
    const withoutPrompt = providers.map(p => groupedByProvider.get(p).without);
    
    const allValues = [...withPrompt, ...withoutPrompt];
    const maxValue = Math.max(...allValues);
    const axisMax = this.computeYAxisMaxWithIncrements(allValues);

    this.promptImpactChartConfig = {
      type: 'bar',
      data: {
        labels: providers,
        datasets: [
          {
            label: 'With User Prompt',
            data: withPrompt,
            backgroundColor: '#06b6d4',
            barPercentage: 0.35,
            categoryPercentage: 0.5
          },
          {
            label: 'Without User Prompt',
            data: withoutPrompt,
            backgroundColor: '#ec4899',
            barPercentage: 0.35,
            categoryPercentage: 0.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
            labels: { font: { weight: 'bold', size: 11 } }
          },
          title: {
            display: false,
            text: '🎯 Human Prompt Influence on Estimation',
            font: { size: 16, weight: 'bold' }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 12 },
            formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
          }
        },
        scales: {
          x: {
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'AI Provider', font: { weight: 'bold', size: 12 } }
          },
          y: {
            beginAtZero: true,
            max: axisMax,
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'Hours', font: { weight: 'bold', size: 12 } }
          }
        }
      }
    };
  }

  private initUsageDistributionChart(): void {
    this.usageDistributionChartConfig = {
      type: 'doughnut',
      data: {
        labels: this.usageDistributionData.map(d => `${d.provider} (${d.count})`),
        datasets: [
          {
            data: this.usageDistributionData.map(d => d.count),
            backgroundColor: ['#3b82f6', '#ef4444'],
            borderColor: '#ffffff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
            position: 'bottom',
            labels: { font: { weight: 'bold', size: 11 } }
          },
          title: {
            display: false,
            text: '📋 AI Usage Distribution',
            font: { size: 16, weight: 'bold' }
          },
          datalabels: {
            font: { weight: 'bold', size: 12 },
            formatter: (value: any) => (typeof value === 'number' ? `${value}` : value)
          }
        }
      }
    };
  }

  private initFrequencyHeatmapChart(): void {
    // Simple bar chart representation of frequency data
    const providers = Array.from(new Set(this.frequencyHeatmapData.map(d => d.provider)));
    const ranges = ['2h', '4h', '8h', '12h', '16h', '20h+'];
    
    const datasets = providers.map((provider, idx) => ({
      label: provider,
      data: ranges.map(range => {
        const item = this.frequencyHeatmapData.find(d => d.provider === provider && d.estimationRange === range);
        return item?.frequency || 0;
      }),
      backgroundColor: idx === 0 ? '#3b82f6' : '#ef4444'
    }));

    const allValues = datasets.flatMap(d => d.data as number[]);
    const maxValue = Math.max(...allValues);
    const roundedMax = maxValue < 1 ? Math.ceil(maxValue * 10) / 10 : Math.round(maxValue);
    const increment = maxValue < 1 ? maxValue : 2;
    const axisMax = roundedMax + increment;

    this.frequencyHeatmapChartConfig = {
      type: 'bar',
      data: {
        labels: ranges,
        datasets: datasets as any
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
            labels: { font: { weight: 'bold', size: 11 } }
          },
          title: {
            display: false,
            text: '🔥 Estimation Range Frequency Distribution',
            font: { size: 16, weight: 'bold' }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            font: { weight: 'bold', size: 12 },
            formatter: (value: any) => (typeof value === 'number' ? value.toFixed(0) : value)
          }
        },
        scales: {
          x: {
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'Estimation Range', font: { weight: 'bold', size: 12 } }
          },
          y: {
            beginAtZero: true,
            max: axisMax,
            ticks: { font: { weight: 'bold', size: 11 } },
            title: { display: false, text: 'Frequency', font: { weight: 'bold', size: 12 } }
          }
        }
      }
    };
  }

  private computeYAxisMaxWithIncrements(values: number[]): number {
    if (!values || !values.length) {
      return 2;
    }
    const finiteVals = values.filter(v => Number.isFinite(v));
    if (!finiteVals.length) {
      return 2;
    }
    const rawMax = Math.max(...finiteVals, 0);
    if (rawMax <= 0) {
      return 2;
    }
    
    // Determine appropriate step size based on magnitude
    let stepSize = 0.2;
    if (rawMax > 100) {
      stepSize = 25;
    } else if (rawMax > 50) {
      stepSize = 10;
    } else if (rawMax > 20) {
      stepSize = 5;
    } else if (rawMax > 10) {
      stepSize = 2;
    } else if (rawMax > 5) {
      stepSize = 1;
    } else if (rawMax > 2) {
      stepSize = 0.5;
    }
    
    // Round up to next step and add 1 more increment
    const roundedUp = Math.ceil(rawMax / stepSize) * stepSize;
    return roundedUp + stepSize;
  }

  private darkenColor(color: string, amount: number): string {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
    const g = Math.max(0, (num >> 8 & 0x00FF) - Math.round(255 * amount));
    const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
    return (usePound ? '#' : '') + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  getProviderColor(provider: string, index: number): string {
    // Gemini gets blue, DeepSeek gets red
    const providerUpper = provider.toUpperCase();
    if (providerUpper.includes('GEMINI')) {
      return '#3b82f6';
    } else if (providerUpper.includes('DEEPSEEK') || providerUpper.includes('DEEP')) {
      return '#ef4444';
    }
    // Fallback to index-based colors
    return index === 0 ? '#3b82f6' : '#ef4444';
  }

  goBack(): void {
    this.router.navigate(['/history']);
  }
}
