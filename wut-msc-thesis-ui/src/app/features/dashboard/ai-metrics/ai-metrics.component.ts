import { Component } from '@angular/core';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, ChartOptions, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule } from '@angular/forms';
import { AiEstimationsService } from '../../../services/ai/ai-estimations.service';
import { Router } from '@angular/router';
import { AiMetricsChartCardComponent } from './components/ai-metrics-chart-card/ai-metrics-chart-card.component';
import { calculateYAxis, getYAxisFromDatasets } from '../../../shared/utils/chart-axis.utils';

Chart.register(ChartDataLabels);

@Component({
  selector: 'app-ai-metrics',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule, AiMetricsChartCardComponent],
  templateUrl: './ai-metrics.component.html',
  styleUrls: ['./ai-metrics.component.css']
})
export class AiMetricsComponent {
    providerBarType: 'bar' = 'bar';
    markdownPieType: 'pie' = 'pie';
    
    // Thesis chart tracking
    showThesisOnly = false;
    thesisCharts = {
      'providerComparison': {
        title: 'Provider Comparison',
        recommended: true,
        priority: 'Essential',
        reason: 'Direct comparison of AI performance'
      },
      'estimationRange': {
        title: 'Estimation Range',
        recommended: true,
        priority: 'Essential',
        reason: 'Shows estimation accuracy & variance'
      },
      'stabilityBox': {
        title: 'Stability Spread (Box Plot)',
        recommended: true,
        priority: 'Essential',
        reason: 'Professional statistical analysis'
      },
      'dualMetricVariance': {
        title: 'Dual Metric Variance',
        recommended: true,
        priority: 'Essential',
        reason: 'Key trade-off insights'
      },
      'comparisonRadar': {
        title: 'Multi-Criteria Radar',
        recommended: true,
        priority: 'Essential',
        reason: 'Holistic comparison view'
      },
      'responseTime': {
        title: 'Response Time',
        recommended: false,
        priority: 'Secondary',
        reason: 'System efficiency'
      },
      'markdownPie': {
        title: 'Markdown Distribution',
        recommended: false,
        priority: 'Optional',
        reason: 'Feature analysis'
      }
    };

  providerBarData: { labels: string[]; datasets: Array<any> } = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Avg Resolution Time (h)',
        backgroundColor: ['#60a5fa', '#f59e0b', '#60a5fa', '#f59e0b'],
        borderColor: ['#2563eb', '#b45309', '#2563eb', '#b45309'],
        borderWidth: 1.5,
        borderRadius: 0,
        maxBarThickness: 16
      }
    ]
  };
  providerBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
        text: 'Provider Comparison - Average Resolution Time',
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
        ticks: { font: { weight: 'bold', size: 11 } },
        title: { display: false, text: 'AI Provider', font: { weight: 'bold', size: 12 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#eee' },
        ticks: { 
          font: { weight: 'bold', size: 11 }
        },
        title: { display: false, text: 'Hours', font: { weight: 'bold', size: 12 } }
      }
    }
  };

  // Chart.js Pie chart config for Markdown ON/OFF
  markdownPieData: { labels: string[]; datasets: Array<any> } = {
    labels: ['Markdown ON', 'Markdown OFF'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#22c55e', '#60a5fa'],
        borderColor: ['#14532d', '#1d4ed8'],
        borderWidth: 2
      }
    ]
  };
  markdownPieOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
        position: 'top',
        labels: { font: { weight: 'bold', size: 12 } }
      },
      title: {
        display: false,
        text: 'Markdown Output Distribution',
        font: { size: 14, weight: 'bold' }
      },
      datalabels: {
        color: '#222',
        font: { weight: 'bold' as const, size: 14 },
        formatter: function(value: any) {
          if (typeof value === 'number') {
            return value;
          }
          return value;
        }
      }
    }
  };

  // Additional charts for metrics analysis
  responseTimeBarData: any = null;
  responseTimeBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: false,
        text: 'Response Time Analysis',
        font: { size: 14, weight: 'bold' }
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#111',
        font: { weight: 'bold', size: 12 },
        formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { weight: 'bold', size: 11 } },
        title: { display: false, text: 'AI Provider', font: { weight: 'bold', size: 12 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#eee' },
        ticks: { font: { weight: 'bold', size: 11 } },
        title: { display: false, text: 'Time (seconds)', font: { weight: 'bold', size: 12 } }
      }
    }
  };
  responseTimeBarType: 'bar' = 'bar';

  estimationRangeBarData: any = null;
  estimationRangeBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false, position: 'top', labels: { font: { weight: 'bold', size: 11 } } },
      title: {
        display: false,
        text: 'Estimation Range Distribution',
        font: { size: 14, weight: 'bold' }
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#111',
        font: { weight: 'bold', size: 11 },
        formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 11 } }, title: { display: false, text: 'Estimation Range', font: { weight: 'bold', size: 12 } } },
      y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { font: { weight: 'bold', size: 11 } }, title: { display: false, text: 'Count', font: { weight: 'bold', size: 12 } } }
    }
  };
  estimationRangeBarType: 'bar' = 'bar';

  estimationTrendLineData: any = null;
  estimationTrendLineOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { display: false, position: 'top', labels: { font: { weight: 'bold', size: 11 } } },
      title: {
        display: false,
        text: 'Estimation Trend Analysis',
        font: { size: 14, weight: 'bold' }
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        color: '#111',
        font: { weight: 'bold', size: 11 },
        formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 11 } }, title: { display: false, text: 'Time Period', font: { weight: 'bold', size: 12 } } },
      y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { font: { weight: 'bold', size: 11 } }, title: { display: false, text: 'Estimation Score', font: { weight: 'bold', size: 12 } } }
    }
  };
  estimationTrendLineType: 'line' = 'line';

  comparisonRadarData: any = null;
  comparisonRadarOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false, position: 'top', labels: { font: { weight: 'bold', size: 11 } } },
      title: {
        display: false,
        text: 'Model Comparison Radar',
        font: { size: 14, weight: 'bold' }
      },
      datalabels: {
        color: '#111',
        font: { weight: 'bold', size: 11 },
        formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        angleLines: { color: '#e5e7eb' },
        pointLabels: { color: '#374151', font: { weight: 'bold', size: 12 } },
        ticks: { font: { weight: 'bold', size: 11 } }
      }
    }
  };
  comparisonRadarType: 'radar' = 'radar';

  // Box-plot style stability chart (min, Q1, median, Q3, max per model)
  stabilityBoxBarData: any = null;
  stabilityBoxBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false, position: 'top', labels: { font: { weight: 'bold', size: 11 } } },
      title: {
        display: false,
        text: 'Stability Analysis',
        font: { size: 14, weight: 'bold' }
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        color: '#111',
        font: { weight: 'bold', size: 11 },
        formatter: (value: any) => (typeof value === 'number' ? value.toFixed(2) : value)
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 11 } }, title: { display: false, text: 'AI Provider', font: { weight: 'bold', size: 12 } } },
      y: { beginAtZero: true, grid: { color: '#eee' }, ticks: { font: { weight: 'bold', size: 11 } }, title: { display: false, text: 'Stability Score', font: { weight: 'bold', size: 12 } } }
    }
  };
  stabilityBoxBarType: 'bar' = 'bar';
  activeMetricsTab: 'metrics-issue' | 'metrics-model' | 'hours-le' | 'hours-gt' | 'days-le' | 'days-gt' | 'markdown-on' | 'markdown-off' | 'explanation-on' | 'explanation-off' = 'metrics-issue';

  metricsIssueKey = '';
  metricsProvider = '';
  hoursThreshold: number | null = null;
  daysThreshold: number | null = null;

  // Bug filter properties
  availableBugs: any[] = [];
  filteredBugs: any[] = [];
  showBugDropdown = false;
  isLoadingBugs = false;

  metricsResult: any = null;
  isLoadingMetrics = false;
  metricsError = '';

  constructor(
    private aiEstimationsService: AiEstimationsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAvailableBugs();
  }

  /**
   * Trigger dropdown to show available bugs after loading
   */
  private showBugOptionsOnLoad(): void {
    if (this.availableBugs.length > 0 && this.activeMetricsTab === 'metrics-issue') {
      this.filteredBugs = this.availableBugs;
      this.showBugDropdown = true;
    }
  }

  /**
   * Load available bugs from backend for filtering
   * Uses getAllMetrics to fetch all metrics and extracts unique issue keys
   */
  private loadAvailableBugs(): void {
    this.isLoadingBugs = true;
    
    this.aiEstimationsService.getAllMetrics().subscribe({
      next: (metricsData: any[]) => {
        this.isLoadingBugs = false;
        
        if (!Array.isArray(metricsData)) {
          console.warn('⚠️ Metrics data is not an array');
          this.availableBugs = [];
          return;
        }

        // Extract unique issue keys from metrics
        const uniqueIssueKeys = new Map<string, any>();
        
        metricsData.forEach((metric: any) => {
          const issueKey = metric.issueKey;
          if (issueKey && !uniqueIssueKeys.has(issueKey)) {
            uniqueIssueKeys.set(issueKey, {
              key: issueKey,
              id: issueKey,
              summary: `Issue ${issueKey}` // Display format
            });
          }
        });

        // Convert map to array
        this.availableBugs = Array.from(uniqueIssueKeys.values());
        this.filteredBugs = this.availableBugs;
        
        console.log('✅ Loaded available issue keys from metrics:', this.availableBugs.length);
        console.log('📋 Issue keys:', this.availableBugs.map((b: any) => b.key).join(', '));
        
        // Auto-show dropdown with bug options on load
        this.showBugOptionsOnLoad();
      },
      error: (err: any) => {
        this.isLoadingBugs = false;
        console.warn('⚠️ Failed to load metrics, bug filter will be empty', err);
        this.availableBugs = [];
        // Bug filter remains available but empty - user can still type manually
      }
    });
  }

  /**
   * Filter bugs based on user input
   */
  onBugInputChange(event: any): void {
    const searchTerm = (event?.target?.value || this.metricsIssueKey).toLowerCase();

    if (!searchTerm) {
      this.filteredBugs = this.availableBugs;
      this.showBugDropdown = false;
      return;
    }

    this.filteredBugs = this.availableBugs.filter(bug =>
      (bug.key && bug.key.toLowerCase().includes(searchTerm)) ||
      (bug.id && bug.id.toLowerCase().includes(searchTerm)) ||
      (bug.summary && bug.summary.toLowerCase().includes(searchTerm))
    );

    this.showBugDropdown = this.filteredBugs.length > 0;
  }

  /**
   * Select bug from dropdown
   */
  selectBug(bug: any): void {
    this.metricsIssueKey = bug.key || bug.id;
    this.showBugDropdown = false;
    this.filteredBugs = [];
    console.log('✅ Selected bug:', this.metricsIssueKey);
  }

  /**
   * Close bug dropdown
   */
  closeBugDropdown(): void {
    this.showBugDropdown = false;
  }

  goBack(): void {
    this.router.navigate(['/ai-estimations']);
  }

  runMetricsQuery(): void {
    this.metricsError = '';
    this.metricsResult = null;
    this.isLoadingMetrics = true;

    let request$;

    switch (this.activeMetricsTab) {
      case 'metrics-issue':
        if (!this.metricsIssueKey) {
          this.metricsError = 'Please enter an issue key.';
          this.isLoadingMetrics = false;
          return;
        }
        request$ = this.aiEstimationsService.getMetricsByIssue(this.metricsIssueKey.trim());
        break;
      case 'metrics-model':
        if (!this.metricsProvider) {
          this.metricsError = 'Please enter an AI provider (e.g. GEMINI, DEEPSEEK).';
          this.isLoadingMetrics = false;
          return;
        }
        request$ = this.aiEstimationsService.getMetricsByProvider(this.metricsProvider.trim());
        break;
      case 'hours-le':
        if (this.hoursThreshold == null) {
          this.metricsError = 'Please enter a number of hours.';
          this.isLoadingMetrics = false;
          return;
        }
        request$ = this.aiEstimationsService.getMetricsByHoursLte(this.hoursThreshold);
        break;
      case 'hours-gt':
        if (this.hoursThreshold == null) {
          this.metricsError = 'Please enter a number of hours.';
          this.isLoadingMetrics = false;
          return;
        }
        request$ = this.aiEstimationsService.getMetricsByHoursGt(this.hoursThreshold);
        break;
      case 'days-le':
        if (this.daysThreshold == null) {
          this.metricsError = 'Please enter a number of days.';
          this.isLoadingMetrics = false;
          return;
        }
        request$ = this.aiEstimationsService.getMetricsByDaysLte(this.daysThreshold);
        break;
      case 'days-gt':
        if (this.daysThreshold == null) {
          this.metricsError = 'Please enter a number of days.';
          this.isLoadingMetrics = false;
          return;
        }
        request$ = this.aiEstimationsService.getMetricsByDaysGt(this.daysThreshold);
        break;
      case 'markdown-on':
        request$ = this.aiEstimationsService.getMetricsByMarkdown(true);
        break;
      case 'markdown-off':
        request$ = this.aiEstimationsService.getMetricsByMarkdown(false);
        break;
      case 'explanation-on':
        request$ = this.aiEstimationsService.getMetricsByExplanation(true);
        break;
      case 'explanation-off':
        request$ = this.aiEstimationsService.getMetricsByExplanation(false);
        break;
      default:
        this.isLoadingMetrics = false;
        return;
    }

    request$.subscribe({
      next: (res) => {
        this.metricsResult = res;
        this.isLoadingMetrics = false;
        this.prepareCharts();
      },
      error: (err) => {
        this.metricsError = 'Failed to load metrics data.';
        console.error('Metrics error', err);
        this.isLoadingMetrics = false;
      }
    });
  }

  // ----- Chart helpers -----
  private asArray(): any[] {
    if (Array.isArray(this.metricsResult)) {
      return this.metricsResult;
    }
    return [];
  }

  private mapProviderComparison(metrics: any[]): { labels: string[]; values: number[] } | null {
    if (!metrics.length) return null;
    const grouped: Record<string, number[]> = {};
    metrics.forEach((m) => {
      const provider = m.aiProvider || m.provider;
      const hours = m.estimatedResolutionHours ?? m.estimatedHours;
      if (!provider || hours == null) return;
      grouped[provider] = grouped[provider] || [];
      grouped[provider].push(hours);
    });
    const labels = Object.keys(grouped);
    if (!labels.length) return null;
    const values = labels.map((key) => {
      const arr = grouped[key];
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    });
    return { labels, values };
  }

  private mapMarkdownToPie(metrics: any[]): { labels: string[]; values: number[] } | null {
    if (!metrics.length) return null;
    let on = 0;
    let off = 0;
    metrics.forEach((m) => {
      if (m.markdownEnabled === true) on++;
      else if (m.markdownEnabled === false) off++;
    });
    if (!on && !off) return null;
    return {
      labels: ['Markdown ON', 'Markdown OFF'],
      values: [on, off]
    };
  }

  // Data for HTML/CSS charts
  get providerComparison(): { label: string; value: number; cssClass: string }[] {
    const data = this.mapProviderComparison(this.asArray());
    if (!data) return [];
    // Update chart data for Chart.js
    this.providerBarData.labels = data.labels;
    this.providerBarData.datasets[0].data = data.values;
    const palette = ['bar-green', 'bar-blue', 'bar-purple', 'bar-orange'];
    return data.labels.map((label, index) => ({
      label,
      value: data.values[index] ?? 0,
      cssClass: palette[index % palette.length]
    }));
  }

  get maxProviderValue(): number {
    return this.providerComparison.reduce((max, p) => (p.value > max ? p.value : max), 0) || 0;
  }

  get markdownDistribution(): { label: string; value: number }[] {
    const data = this.mapMarkdownToPie(this.asArray());
    if (!data) return [];
    // Update chart data for Chart.js
    this.markdownPieData.labels = data.labels;
    this.markdownPieData.datasets[0].data = data.values;
    return data.labels.map((label, index) => ({ label, value: data.values[index] ?? 0 }));
  }

  get totalMarkdownRuns(): number {
    return this.markdownDistribution.reduce((sum, m) => sum + m.value, 0) || 0;
  }

  /**
   * Update chart options with dynamic Y-axis based on actual data values
   * Ensures max is one step beyond data AND all grid lines are visible
   */
  private updateChartYAxis(options: any, maxDataValue: number): void {
    if (!options || !options.scales || !options.scales.y) {
      return;
    }
    const yAxisConfig = this.getYAxisConfig([maxDataValue]);
    options.scales.y.max = yAxisConfig.max;
    options.scales.y.ticks = {
      ...options.scales.y.ticks,
      stepSize: yAxisConfig.stepSize
    };
  }

  // Build additional Chart.js datasets from current metricsResult
  private prepareCharts(): void {
    const metrics = this.asArray();
    if (!metrics.length) {
      this.responseTimeBarData = null;
      this.estimationRangeBarData = null;
      this.estimationTrendLineData = null;
      this.comparisonRadarData = null;
      this.stabilityBoxBarData = null;
      return;
    }

    // Helper: group records by AI provider
    const byProvider: Record<string, any[]> = {};
    metrics.forEach(m => {
      const provider = m.aiProvider || m.provider;
      if (!provider) return;
      if (!byProvider[provider]) {
        byProvider[provider] = [];
      }
      byProvider[provider].push(m);
    });
    const providers = Object.keys(byProvider);
    if (!providers.length) {
      this.responseTimeBarData = null;
      this.estimationRangeBarData = null;
      this.estimationTrendLineData = null;
      this.comparisonRadarData = null;
      this.stabilityBoxBarData = null;
      return;
    }

    // 1) Bar chart – average response time per model
    const avgResponseTimes: number[] = providers.map(p => {
      const arr = byProvider[p];
      const secs = arr.map((m: any) => {
        const sec = m.analysisTimeSec != null
          ? Number(m.analysisTimeSec)
          : m.analysisTimeMs != null
            ? Number(m.analysisTimeMs) / 1000
            : 0;
        return isFinite(sec) ? sec : 0;
      });
      const sum = secs.reduce((a, b) => a + b, 0);
      return secs.length ? sum / secs.length : 0;
    });

    this.responseTimeBarData = {
      labels: providers,
      datasets: [
        {
          label: 'Avg response time (sec)',
          data: avgResponseTimes,
          backgroundColor: ['#60a5fa', '#f59e0b', '#60a5fa', '#f59e0b'],
          borderColor: ['#2563eb', '#b45309', '#2563eb', '#b45309'],
          borderWidth: 1.5,
          borderRadius: 0,
          maxBarThickness: 16
        }
      ]
    };
    this.responseTimeBarOptions = {
      responsive: true,
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          max: this.getYAxisConfig(avgResponseTimes).max,
          grid: { display: true },
          ticks: {
            stepSize: this.getYAxisConfig(avgResponseTimes).stepSize
          }
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#222',
          font: { weight: 'bold', size: 12 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };

    // 2) Grouped bar chart – estimation distribution (min/avg/max hours) per model
    const mins: number[] = [];
    const avgs: number[] = [];
    const maxs: number[] = [];

    providers.forEach(p => {
      const hoursArr = byProvider[p]
        .map((m: any) => m.estimatedResolutionHours ?? m.estimatedHours)
        .filter((v: any) => v != null)
        .map((v: any) => Number(v));
      if (!hoursArr.length) {
        mins.push(0);
        avgs.push(0);
        maxs.push(0);
        return;
      }
      const min = Math.min(...hoursArr);
      const max = Math.max(...hoursArr);
      const avg = hoursArr.reduce((a: number, b: number) => a + b, 0) / hoursArr.length;
      mins.push(min);
      avgs.push(avg);
      maxs.push(max);
    });

    const rangeValues = [...mins, ...avgs, ...maxs];
    this.estimationRangeBarData = {
      labels: providers,
      datasets: [
        {
          label: 'Min hours',
          data: mins,
          backgroundColor: '#60a5fa',
          borderColor: '#2563eb',
          borderWidth: 1.5,
          borderRadius: 0,
          maxBarThickness: 14
        },
        {
          label: 'Avg hours',
          data: avgs,
          backgroundColor: '#f59e0b',
          borderColor: '#b45309',
          borderWidth: 1.5,
          borderRadius: 0,
          maxBarThickness: 14
        },
        {
          label: 'Max hours',
          data: maxs,
          backgroundColor: '#f97316',
          borderColor: '#c2410c',
          borderWidth: 1.5,
          borderRadius: 0,
          maxBarThickness: 14
        }
      ]
    };
    this.estimationRangeBarOptions = {
      responsive: true,
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          max: this.getYAxisConfig(rangeValues).max,
          grid: { display: true },
          ticks: {
            stepSize: this.getYAxisConfig(rangeValues).stepSize
          }
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#222',
          font: { weight: 'bold', size: 11 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };

      // 2b) Box-plot-style grouped bar: min, Q1, median, Q3, max per model
      const q1s: number[] = [];
      const medians: number[] = [];
      const q3s: number[] = [];

      providers.forEach(p => {
        const hoursArr = byProvider[p]
          .map((m: any) => m.estimatedResolutionHours ?? m.estimatedHours)
          .filter((v: any) => v != null)
          .map((v: any) => Number(v))
          .sort((a: number, b: number) => a - b);
        if (!hoursArr.length) {
          q1s.push(0);
          medians.push(0);
          q3s.push(0);
          return;
        }
        const quantile = (arr: number[], p: number): number => {
          if (!arr.length) return 0;
          const pos = (arr.length - 1) * p;
          const base = Math.floor(pos);
          const rest = pos - base;
          if (arr[base + 1] !== undefined) {
            return arr[base] + rest * (arr[base + 1] - arr[base]);
          }
          return arr[base];
        };
        q1s.push(quantile(hoursArr, 0.25));
        medians.push(quantile(hoursArr, 0.5));
        q3s.push(quantile(hoursArr, 0.75));
      });

      const boxAllValues = [
        ...mins,
        ...q1s,
        ...medians,
        ...q3s,
        ...maxs
      ];

      this.stabilityBoxBarData = {
        labels: providers,
        datasets: [
          {
            label: 'Min hours',
            data: mins,
            backgroundColor: '#e5e7eb',
            borderColor: '#4b5563',
            borderWidth: 1.5,
            borderRadius: 0,
            maxBarThickness: 12
          },
          {
            label: 'Q1 (25%)',
            data: q1s,
            backgroundColor: '#bfdbfe',
            borderColor: '#0369a1',
            borderWidth: 1.5,
            borderRadius: 0,
            maxBarThickness: 12
          },
          {
            label: 'Median (50%)',
            data: medians,
            backgroundColor: '#60a5fa',
            borderColor: '#1d4ed8',
            borderWidth: 1.5,
            borderRadius: 0,
            maxBarThickness: 12
          },
          {
            label: 'Q3 (75%)',
            data: q3s,
            backgroundColor: '#f59e0b',
            borderColor: '#1d4ed8',
            borderWidth: 1.5,
            borderRadius: 0,
            maxBarThickness: 12
          },
          {
            label: 'Max hours',
            data: maxs,
            backgroundColor: '#f97316',
            borderColor: '#b91c1c',
            borderWidth: 1.5,
            borderRadius: 0,
            maxBarThickness: 12
          }
        ]
      };
      this.stabilityBoxBarOptions = {
        responsive: true,
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            max: this.getYAxisConfig(boxAllValues).max,
            grid: { display: true },
            ticks: {
              stepSize: this.getYAxisConfig(boxAllValues).stepSize
            }
          }
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: '#222',
            font: { weight: 'bold', size: 10 },
            formatter: (value: any) => {
              const num = typeof value === 'number' ? value : Number(value);
              return Number.isFinite(num) ? num.toFixed(2) : value;
            }
          }
        }
      };

    // 3) Line chart – estimation evolution over time
    const timeEntries = metrics
      .filter(m => m.estimatedResolutionHours != null || m.estimatedHours != null)
      .map(m => ({
        provider: m.aiProvider || m.provider,
        createdAt: m.createdAt ? new Date(m.createdAt) : null,
        hours: Number(m.estimatedResolutionHours ?? m.estimatedHours)
      }))
      .filter(e => e.provider && e.createdAt && isFinite(e.hours))
      .sort((a, b) => (a.createdAt!.getTime() - b.createdAt!.getTime()));

    if (timeEntries.length) {
      const labels = timeEntries.map(e => e.createdAt!.toLocaleTimeString());
      const seriesByProvider: Record<string, number[]> = {};
      providers.forEach(p => {
        seriesByProvider[p] = new Array(labels.length).fill(null);
      });
      timeEntries.forEach((e, idx) => {
        if (!seriesByProvider[e.provider]) {
          seriesByProvider[e.provider] = new Array(labels.length).fill(null);
        }
        seriesByProvider[e.provider][idx] = e.hours;
      });

      const datasets = providers.map(p => ({
        label: p,
        data: seriesByProvider[p],
        borderColor: p.toUpperCase().includes('GEMINI') ? '#2563eb' : '#16a34a',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.3
      }));

      this.estimationTrendLineData = { labels, datasets };
      const trendValues = timeEntries.map(e => e.hours);
      this.estimationTrendLineOptions = {
        responsive: true,
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#222',
            font: { weight: 'bold', size: 10 },
            formatter: (value: any) => {
              const num = typeof value === 'number' ? value : Number(value);
              return Number.isFinite(num) ? num.toFixed(2) : '';
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            max: this.getYAxisConfig(trendValues).max,
            grid: { display: true },
            ticks: {
              stepSize: this.getYAxisConfig(trendValues).stepSize
            }
          }
        }
      };
    } else {
      this.estimationTrendLineData = null;
      this.estimationTrendLineOptions = {};
    }

    // 4) Radar chart – multi-criteria comparison per model
    const radarLabels = [
      'Avg response time (sec)',
      'Avg estimated hours',
      'Estimation range (h)',
      'Explanation enabled (%)'
    ];
    const radarDatasets: any[] = [];
    const radarAllValues: number[] = [];

    providers.forEach(p => {
      const records = byProvider[p];
      const secs = records.map((m: any) => {
        const sec = m.analysisTimeSec != null
          ? Number(m.analysisTimeSec)
          : m.analysisTimeMs != null
            ? Number(m.analysisTimeMs) / 1000
            : 0;
        return isFinite(sec) ? sec : 0;
      });
      const estArr = records
        .map((m: any) => m.estimatedResolutionHours ?? m.estimatedHours)
        .filter((v: any) => v != null)
        .map((v: any) => Number(v));
      const explanationOn = records.filter((m: any) => m.explanationEnabled === true).length;
      const count = records.length || 1;

      const avgSec = secs.length ? secs.reduce((a, b) => a + b, 0) / secs.length : 0;
      const avgHours = estArr.length ? estArr.reduce((a, b) => a + b, 0) / estArr.length : 0;
      const rangeHours = estArr.length ? Math.max(...estArr) - Math.min(...estArr) : 0;
      const explanationRatio = (explanationOn / count) * 100;

      const values = [avgSec, avgHours, rangeHours, explanationRatio];
      radarAllValues.push(...values);

      const isGemini = p.toUpperCase().includes('GEMINI');
      radarDatasets.push({
        label: p,
        data: values,
        backgroundColor: isGemini ? 'rgba(37,99,235,0.15)' : 'rgba(22,163,74,0.15)',
        borderColor: isGemini ? '#2563eb' : '#16a34a',
        pointBackgroundColor: isGemini ? '#2563eb' : '#16a34a'
      });
    });

    this.comparisonRadarData = {
      labels: radarLabels,
      datasets: radarDatasets
    };
    this.comparisonRadarOptions = {
      responsive: true,
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#222',
          font: { weight: 'bold', size: 11 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: this.computeYAxisMax(radarAllValues)
        }
      }
    };
  }

  // Utility: compute a nice Y-axis max with two extra units above the highest value
  private computeYAxisMax(values: number[]): number {
    if (!values || values.length === 0) {
      return 1;
    }
    const finiteVals = values.filter(v => Number.isFinite(v) && v > 0);
    if (finiteVals.length === 0) {
      return 1;
    }
    const maxValue = Math.max(...finiteVals);
    return calculateYAxis(maxValue).max;
  }

  /**
   * Get complete Y-axis configuration (max and stepSize) for a dataset
   */
  private getYAxisConfig(values: number[]): { max: number; stepSize: number } {
    if (!values || values.length === 0) {
      return { max: 1, stepSize: 1 };
    }
    const finiteVals = values.filter(v => Number.isFinite(v) && v > 0);
    if (finiteVals.length === 0) {
      return { max: 1, stepSize: 1 };
    }
    const maxValue = Math.max(...finiteVals);
    return calculateYAxis(maxValue);
  }

  get markdownOnPercent(): number {
    if (!this.totalMarkdownRuns) return 0;
    const on = this.markdownDistribution.find((m) => m.label === 'Markdown ON')?.value ?? 0;
    return (on / this.totalMarkdownRuns) * 100;
  }

  get markdownOffPercent(): number {
    if (!this.totalMarkdownRuns) return 0;
    const off = this.markdownDistribution.find((m) => m.label === 'Markdown OFF')?.value ?? 0;
    return (off / this.totalMarkdownRuns) * 100;
  }

  /**
   * Toggle thesis-only view mode
   */
  toggleThesisMode(): void {
    this.showThesisOnly = !this.showThesisOnly;
    console.log(`📖 Thesis Mode: ${this.showThesisOnly ? 'ON' : 'OFF'}`);
  }

  /**
   * Check if a chart should be visible in thesis mode
   */
  isChartVisibleInThesisMode(chartKey: string): boolean {
    if (!this.showThesisOnly) return true;
    const chart = this.thesisCharts[chartKey as keyof typeof this.thesisCharts];
    return chart?.recommended ?? false;
  }

  /**
   * Get thesis badge information for a chart
   */
  getThesisBadge(chartKey: string): { show: boolean; priority: string } {
    const chart = this.thesisCharts[chartKey as keyof typeof this.thesisCharts];
    return {
      show: chart?.recommended ?? false,
      priority: chart?.priority ?? 'N/A'
    };
  }

  /**
   * Export all recommended thesis charts as PNG images
   * Note: Requires html2canvas library in production
   */
  exportThesisCharts(): void {
    console.log('📥 Preparing to export thesis charts...');
    const recommendedCharts = Object.entries(this.thesisCharts)
      .filter(([_, config]) => config.recommended)
      .map(([key, config]) => `${config.title} (${config.priority})`)
      .join(', ');
    
    console.log(`✅ Ready to export: ${recommendedCharts}`);
    console.log('💡 Tip: Use browser Print function (Ctrl+P) to save as PDF with all visible charts');
  }

  /**
   * Get thesis chart statistics
   */
  getThesisStats(): { total: number; recommended: number; secondary: number; optional: number } {
    return {
      total: Object.keys(this.thesisCharts).length,
      recommended: Object.values(this.thesisCharts).filter(c => c.recommended && c.priority === 'Essential').length,
      secondary: Object.values(this.thesisCharts).filter(c => c.priority === 'Secondary').length,
      optional: Object.values(this.thesisCharts).filter(c => c.priority === 'Optional').length
    };
  }
}
