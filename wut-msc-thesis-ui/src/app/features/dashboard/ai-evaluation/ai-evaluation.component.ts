import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { AiEstimationsService } from '../../../services/ai/ai-estimations.service';
import { forkJoin, Observable, of } from 'rxjs';
import { AiEvalByIssueComponent } from './by-issue/ai-eval-by-issue.component';
import { AiEvalModelComparisonComponent } from './model-comparison/ai-eval-model-comparison.component';
import { AiEvalByModelComponent } from './by-model/ai-eval-by-model.component';
import { AiEvalFeatureImpactComponent } from './feature-impact/ai-eval-feature-impact.component';
import { AiEvalStabilityComponent } from './stability/ai-eval-stability.component';
import { AiEvaluationControlsComponent } from './controls/ai-evaluation-controls.component';
import { calculateYAxis } from '../../../shared/utils/chart-axis.utils';

@Component({
  selector: 'app-ai-evaluation',
  templateUrl: './ai-evaluation.component.html',
  styleUrls: ['./ai-evaluation.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgChartsModule,
    AiEvaluationControlsComponent,
    AiEvalByIssueComponent,
    AiEvalModelComparisonComponent,
    AiEvalByModelComponent,
    AiEvalFeatureImpactComponent,
    AiEvalStabilityComponent
  ]
})
export class AiEvaluationComponent {
  // Properties for template bindings
  isLoadingEvaluation = false;
  activeEvaluationTab: 'by-issue' | 'comparison' | 'by-model' | 'features' | 'stability' = 'by-issue';
  evalIssueKey: string = '';
  evalProvider: string | null = null;
  stabilityIssueKey: string = '';
  evaluationResult: any = null;
  hasProviderStats = false;
  maxProviderAvgHours = 0;
  providerBarData: any;
  providerBarOptions: any;
  providerBarType: any;
  byIssueTimeBarData: any;
  byIssueTimeBarOptions: any;
  byIssueTimeBarType: any;
  byIssueAllStatsBarData: any;
  byIssueAllStatsBarOptions: any;
  byIssueAllStatsBarType: any;
  byIssueOverallBarData: any;
  byIssueOverallBarOptions: any;
  byIssueOverallBarType: any;
  modelComparisonAllStatsBarData: any;
  modelComparisonAllStatsBarOptions: any;
  modelComparisonAllStatsBarType: any;
  // Feature impact (Markdown) charts
  markdownEnabledPieData: any;
  markdownDisabledPieData: any;
  markdownPieOptions: any;
  markdownPieType: any;
  markdownBarData: any;
  markdownBarOptions: any;
  markdownBarType: any;
  modelStatsBarData: any;
  modelStatsBarOptions: any;
  modelStatsBarType: any;
  modelAllStatsBarData: any;
  modelAllStatsBarOptions: any;
  modelAllStatsBarType: any;
  // By AI Model charts
  modelByModelPieData: any;
  modelByModelPieOptions: any;
  modelByModelPieType: any;
  modelByModelBarData: any;
  modelByModelBarOptions: any;
  modelByModelBarType: any;
  // Stability (per issue) charts
  stabilityBarData: any;
  stabilityBarOptions: any;
  stabilityBarType: any;
  stabilityRadarData: any;
  stabilityRadarOptions: any;
  stabilityRadarType: any;
    stabilityPieData: any;
    stabilityPieOptions: any;
    stabilityPieType: any;
    stabilityLineData: any;
    stabilityLineOptions: any;
    stabilityLineType: any;
  // Model comparison (Gemini vs DeepSeek) charts
  comparisonPerfAvgBarData: any;
  comparisonPerfAvgBarOptions: any;
  comparisonPerfAvgBarType: any;
  comparisonPerfDetailBarData: any;
  comparisonPerfDetailBarOptions: any;
  comparisonPerfDetailBarType: any;
  comparisonRadarData: any;
  comparisonRadarOptions: any;
  comparisonRadarType: any;
  estimationComparisonBarData: any;
  estimationComparisonBarOptions: any;
  estimationComparisonBarType: any;
  stabilityComparisonPieData: any;
  stabilityComparisonPieOptions: any;
  stabilityComparisonPieType: any;
  qualityVsSpeedScatterData: any;
  qualityVsSpeedScatterOptions: any;
  qualityVsSpeedScatterType: any;
  compositeScoreBarData: any;
  compositeScoreBarOptions: any;
  compositeScoreBarType: any;
  advantageDivergingBarData: any;
  advantageDivergingBarOptions: any;
  advantageDivergingBarType: any;
  comparisonHeatmapMatrix: Array<{ label: string; metrics: Array<{ key: string; label: string; value: number; normalized: number }> }> | null = null;
  responseTimeBoxPlotData: Array<{ label: string; min: number; q1: number; median: number; q3: number; max: number }> | null = null;
  responseTimeBoxPlotRange: { min: number; max: number } | null = null;
  speedQualityBubbleData: any;
  speedQualityBubbleOptions: any;
  speedQualityBubbleType: any;
  estimationRangeStackedData: any;
  estimationRangeStackedOptions: any;
  estimationRangeStackedType: any;
  stabilitySlopeData: any;
  stabilitySlopeOptions: any;
  stabilitySlopeType: any;
  private readonly providerPalette = [
    { border: '#2563eb', fill: 'rgba(37, 99, 235, 0.2)', solid: 'rgba(37, 99, 235, 0.7)' },
    { border: '#f97316', fill: 'rgba(249, 115, 22, 0.2)', solid: 'rgba(249, 115, 22, 0.7)' },
    { border: '#10b981', fill: 'rgba(16, 185, 129, 0.2)', solid: 'rgba(16, 185, 129, 0.7)' },
    { border: '#a855f7', fill: 'rgba(168, 85, 247, 0.2)', solid: 'rgba(168, 85, 247, 0.7)' },
    { border: '#e11d48', fill: 'rgba(225, 29, 72, 0.2)', solid: 'rgba(225, 29, 72, 0.7)' }
  ];

  // Methods for template actions
  goBack() {
    // Implement navigation logic here
    window.history.back();
  }

  constructor(private aiEstimationsService: AiEstimationsService) {}

  runEvaluation() {
    this.isLoadingEvaluation = true;
    this.evaluationResult = null;

    let request$: Observable<any> | null = null;

    switch (this.activeEvaluationTab) {
      case 'by-issue': {
        const key = (this.evalIssueKey || '').trim();
        if (!key) {
          this.isLoadingEvaluation = false;
          this.evaluationResult = { error: 'Please enter an issue key.' };
          return;
        }
        request$ = this.aiEstimationsService.getEvaluationByIssue(key);
        break;
      }
      case 'by-model': {
        const provider = (this.evalProvider || '').toString().trim();
        if (!provider) {
          this.isLoadingEvaluation = false;
          this.evaluationResult = { error: 'Please select an AI provider.' };
          return;
        }
        request$ = this.aiEstimationsService.getEvaluationByModel(provider);
        break;
      }
      case 'features': {
        // Uses evaluation feature-impact endpoint
        request$ = this.aiEstimationsService.getFeatureImpact();
        break;
      }
      case 'stability': {
        const key = (this.stabilityIssueKey || '').trim();
        if (!key) {
          this.isLoadingEvaluation = false;
          this.evaluationResult = { error: 'Please enter an issue key for stability analysis.' };
          return;
        }
        request$ = this.aiEstimationsService.getStabilityAnalysis(key);
        break;
      }
      case 'comparison': {
        // Aggregate all model-comparison endpoints into one result object
        request$ = forkJoin({
          full: this.aiEstimationsService.getFullModelComparison(),
          estimation: this.aiEstimationsService.getEstimationComparison(),
          stability: this.aiEstimationsService.getStabilityComparison(),
          content: this.aiEstimationsService.getContentQualityComparison(),
          performance: this.aiEstimationsService.getPerformanceComparison(),
          summary: this.aiEstimationsService.getComparisonSummary()
        });
        break;
      }
      default: {
        // Fallback: do nothing but keep UI consistent
        request$ = of({ info: 'No evaluation mode selected.' });
        break;
      }
    }

    request$?.subscribe({
      next: result => {
        this.evaluationResult = result;
        this.isLoadingEvaluation = false;

        if (this.activeEvaluationTab === 'by-issue') {
          this.prepareByIssueCharts(result);
        } else if (this.activeEvaluationTab === 'by-model') {
          this.prepareByModelCharts(result);
        } else if (this.activeEvaluationTab === 'features') {
          this.prepareFeatureImpactCharts(result);
        } else if (this.activeEvaluationTab === 'stability') {
          this.prepareStabilityCharts(result);
        } else if (this.activeEvaluationTab === 'comparison') {
          this.prepareModelComparisonCharts(result);
        }
      },
      error: err => {
        console.error('AI evaluation error', err);
        this.evaluationResult = { error: 'Failed to load evaluation. Check backend/API.', details: err?.message ?? err };
        this.isLoadingEvaluation = false;
      }
    });
  }

  private prepareByIssueCharts(result: any): void {
    if (!result || !result.providers) {
      this.hasProviderStats = false;
      return;
    }

    const providers = result.providers || {};
    const gemini = providers['GEMINI'] || providers['Gemini'] || {};
    const deepseek = providers['DEEPSEEK'] || providers['DeepSeek'] || {};

    const gAvgHours = Number(gemini.avghours ?? gemini.avgHours ?? 0);
    const dAvgHours = Number(deepseek.avghours ?? deepseek.avgHours ?? 0);
    const gAvgTimeSec = Number(gemini.avgTimeMS ?? gemini.avgTimeMs ?? 0) / 1000;
    const dAvgTimeSec = Number(deepseek.avgTimeMS ?? deepseek.avgTimeMs ?? 0) / 1000;
    const gRuns = Number(gemini.runs ?? 0);
    const dRuns = Number(deepseek.runs ?? 0);

    const totalRuns = Number(result.totalRuns ?? 0);
    const minHours = Number(result.minEstimatedHours ?? 0);
    const maxHours = Number(result.maxEstimatedHours ?? 0);
    const avgIssueHours = Number(result.avgEstimatedHours ?? 0);
    const avgIssueTimeSec = Number(result.avgAnalysisTimeMS ?? result.avgAnalysisTimeMs ?? 0) / 1000;

    // Chart 1: Average estimated hours by provider
    this.providerBarData = {
      labels: ['Gemini', 'DeepSeek'],
      datasets: [
        {
          data: [gAvgHours, dAvgHours],
          label: 'Avg estimated hours',
          backgroundColor: ['#1976d2', '#43a047'],
          borderRadius: 8,
          maxBarThickness: 40
        }
      ]
    };
    this.providerBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          max: this.computeYAxisMax([gAvgHours, dAvgHours]),
          ticks: { font: { weight: 'bold' } }
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
    this.providerBarType = 'bar';
    this.maxProviderAvgHours = Math.max(gAvgHours, dAvgHours, 0);
    this.hasProviderStats = this.maxProviderAvgHours > 0;

    // Chart 2: Average analysis time (seconds) by provider
    this.byIssueTimeBarData = {
      labels: ['Gemini', 'DeepSeek'],
      datasets: [
        {
          data: [gAvgTimeSec, dAvgTimeSec],
          label: 'Avg analysis time (sec)',
          backgroundColor: ['#1976d2', '#43a047'],
          borderRadius: 8,
          maxBarThickness: 40
        }
      ]
    };
    this.byIssueTimeBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          max: this.computeYAxisMax([gAvgTimeSec, dAvgTimeSec]),
          ticks: { font: { weight: 'bold' } }
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
    this.byIssueTimeBarType = 'bar';

    // Chart 3: All key stats (grouped bars for providers + overall issue)
    const labels = ['Avg est. hours', 'Avg time (sec)', 'Runs', 'Min est. hours', 'Max est. hours'];
    // Chart 3a: Gemini vs DeepSeek detailed stats
    this.byIssueAllStatsBarData = {
      labels,
      datasets: [
        {
          label: 'Gemini',
          backgroundColor: '#1976d2',
          data: [gAvgHours, gAvgTimeSec, gRuns, minHours, maxHours]
        },
        {
          label: 'DeepSeek',
          backgroundColor: '#43a047',
          data: [dAvgHours, dAvgTimeSec, dRuns, minHours, maxHours]
        }
      ]
    };
    const allStatValues: number[] = [
      gAvgHours, dAvgHours,
      gAvgTimeSec, dAvgTimeSec,
      gRuns, dRuns,
      avgIssueHours, avgIssueTimeSec,
      totalRuns,
      minHours, maxHours
    ];

    this.byIssueAllStatsBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          max: this.computeYAxisMax(allStatValues),
          ticks: { font: { weight: 'bold' } }
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#222',
          font: { weight: 'bold', size: 11 },
          formatter: (value: any, context: any) => {
            const label = context?.chart?.data?.labels?.[context.dataIndex] as string | undefined;
            const num = typeof value === 'number' ? value : Number(value);
            if (label && label.toLowerCase().includes('runs')) {
              return Number.isFinite(num) ? Math.round(num).toString() : value;
            }
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };
    this.byIssueAllStatsBarType = 'bar';

    // Chart 3b: Issue overall stats only
    this.byIssueOverallBarData = {
      labels,
      datasets: [
        {
          label: 'Issue overall',
          backgroundColor: '#ff9800',
          data: [avgIssueHours, avgIssueTimeSec, totalRuns, minHours, maxHours]
        }
      ]
    };
    const overallValues: number[] = [
      avgIssueHours, avgIssueTimeSec, totalRuns, minHours, maxHours
    ];

    this.byIssueOverallBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          max: this.computeYAxisMax(overallValues),
          ticks: { font: { weight: 'bold' } }
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#222',
          font: { weight: 'bold', size: 11 },
          formatter: (value: any, context: any) => {
            const label = context?.chart?.data?.labels?.[context.dataIndex] as string | undefined;
            const num = typeof value === 'number' ? value : Number(value);
            if (label && label.toLowerCase().includes('runs')) {
              return Number.isFinite(num) ? Math.round(num).toString() : value;
            }
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };
    this.byIssueOverallBarType = 'bar';

  }

  private prepareStabilityCharts(result: any): void {
    if (!result) {
      this.stabilityBarData = null;
      this.stabilityRadarData = null;
      return;
    }

    const issueKey = String(result.issueKey ?? result.issue ?? this.stabilityIssueKey ?? '').trim();
    const minHours = Number(result.minHours ?? result.minimumHours ?? 0);
    const avgHours = Number(result.avgHours ?? result.averageHours ?? 0);
    const maxHours = Number(result.maxHours ?? result.maximumHours ?? 0);
    const stdDevHours = Number(result.stdDeviationHours ?? result.stdDevHours ?? 0);

    const labels = ['Min hours', 'Avg hours', 'Max hours', 'Std dev (hours)'];
    const values = [minHours, avgHours, maxHours, stdDevHours];

    // Bar chart: stability summary for this issue
    this.stabilityBarData = {
      labels,
      datasets: [
        {
          label: issueKey ? `Stability for ${issueKey}` : 'Issue stability',
          data: values,
          backgroundColor: ['#66bb6a', '#42a5f5', '#ef5350', '#ffa726'],
          borderRadius: 8,
          maxBarThickness: 40
        }
      ]
    };
    this.stabilityBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          max: this.computeYAxisMax(values),
          ticks: { font: { weight: 'bold' } }
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
    this.stabilityBarType = 'bar';

    // Line chart: same metrics over a simple index axis
    this.stabilityLineData = {
      labels,
      datasets: [
        {
          label: issueKey ? `Stability (hours) - ${issueKey}` : 'Stability (hours)',
          data: values,
          borderColor: '#2563eb',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3
        }
      ]
    };
    this.stabilityLineOptions = {
      responsive: true,
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'top',
          color: '#222',
          font: { weight: 'bold', size: 11 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, max: this.computeYAxisMax(values) }
      }
    };
    this.stabilityLineType = 'line';

    // Pie chart: share of each stability metric in hours
    this.stabilityPieData = {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ['#66bb6a', '#42a5f5', '#ef5350', '#ffa726']
        }
      ]
    };
    this.stabilityPieOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: { size: 11 }
          },
          maxWidth: 1000
        },
        datalabels: {
          color: '#222',
          font: { weight: 'bold', size: 12 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };
    this.stabilityPieType = 'pie';

    // Radar chart: same metrics in radial form
    this.stabilityRadarData = {
      labels,
      datasets: [
        {
          label: issueKey || 'Issue',
          data: values,
          backgroundColor: 'rgba(25, 118, 210, 0.2)',
          borderColor: '#1976d2',
          pointBackgroundColor: '#1976d2',
          pointBorderColor: '#1976d2'
        }
      ]
    };
    this.stabilityRadarOptions = {
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
          suggestedMax: this.computeYAxisMax(values)
        }
      }
    };
    this.stabilityRadarType = 'radar';
  }

  private prepareFeatureImpactCharts(result: any): void {
    if (!result) {
      this.markdownEnabledPieData = null;
      this.markdownDisabledPieData = null;
      this.markdownBarData = null;
      return;
    }

    const enabledRaw = result.markdownEnabled || result.MarkdownEnabled || {};
    const disabledRaw = result.markdownDisabled || result.MarkdownDisabled || {};

    const enabledRuns = Number(enabledRaw.runs ?? enabledRaw.totalRuns ?? 0);
    const disabledRuns = Number(disabledRaw.runs ?? disabledRaw.totalRuns ?? 0);

    const enabledTimeSec = Number(
      enabledRaw.avgTimeMS ?? enabledRaw.avgTimeMs ?? enabledRaw.avgAnalysisTimeMS ?? enabledRaw.avgAnalysisTimeMs ?? 0
    ) / 1000;
    const disabledTimeSec = Number(
      disabledRaw.avgTimeMS ?? disabledRaw.avgTimeMs ?? disabledRaw.avgAnalysisTimeMS ?? disabledRaw.avgAnalysisTimeMs ?? 0
    ) / 1000;

    // Two pie charts: one for Markdown enabled, one for Markdown disabled
    this.markdownEnabledPieData = {
      labels: ['Total runs', 'Avg analysis time (sec)'],
      datasets: [
        {
          data: [enabledRuns, enabledTimeSec],
          backgroundColor: ['#42a5f5', '#66bb6a']
        }
      ]
    };

    this.markdownDisabledPieData = {
      labels: ['Total runs', 'Avg analysis time (sec)'],
      datasets: [
        {
          data: [disabledRuns, disabledTimeSec],
          backgroundColor: ['#ef6c00', '#ab47bc']
        }
      ]
    };

    this.markdownPieOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: { size: 11 }
          },
          maxWidth: 1000
        },
        datalabels: {
          color: '#222',
          font: { weight: 'bold', size: 12 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };
    this.markdownPieType = 'pie';

    // Bar chart: enabled vs disabled for runs and analysis time (seconds)
    const barLabels = ['Total runs', 'Avg analysis time (sec)'];
    const enabledValues = [enabledRuns, enabledTimeSec];
    const disabledValues = [disabledRuns, disabledTimeSec];
    const allValues = [...enabledValues, ...disabledValues];

    this.markdownBarData = {
      labels: barLabels,
      datasets: [
        {
          label: 'Markdown enabled',
          data: enabledValues,
          backgroundColor: '#42a5f5',
          borderRadius: 8,
          maxBarThickness: 40
        },
        {
          label: 'Markdown disabled',
          data: disabledValues,
          backgroundColor: '#ef6c00',
          borderRadius: 8,
          maxBarThickness: 40
        }
      ]
    };

    this.markdownBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          max: this.computeYAxisMax(allValues),
          ticks: { font: { weight: 'bold' } }
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#222',
          font: { weight: 'bold', size: 12 },
          formatter: (value: any, context: any) => {
            const label = context?.chart?.data?.labels?.[context.dataIndex] as string | undefined;
            const num = typeof value === 'number' ? value : Number(value);
            if (label && label.toLowerCase().includes('runs')) {
              return Number.isFinite(num) ? Math.round(num).toString() : value;
            }
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };
    this.markdownBarType = 'bar';
  }

  private prepareByModelCharts(result: any): void {
    if (!result) {
      this.modelByModelPieData = null;
      this.modelByModelBarData = null;
      return;
    }

    const totalRuns = Number(result.totalRuns ?? 0);
    const uniqueIssues = Number(result.uniqueIssues ?? result.distinctIssues ?? 0);
    const avgAnalysisTimeSec = Number(result.avgAnalysisTimeMS ?? result.avgAnalysisTimeMs ?? 0) / 1000;
    const avgEstimatedHours = Number(result.avgEstimatedHours ?? result.avgHours ?? 0);

    // Pie chart: total runs vs avg analysis time (sec) vs avg estimated hours
    this.modelByModelPieData = {
      labels: ['Total runs', 'Avg analysis time (sec)', 'Avg estimated hours'],
      datasets: [
        {
          data: [totalRuns, avgAnalysisTimeSec, avgEstimatedHours],
          backgroundColor: ['#42a5f5', '#66bb6a', '#ffca28']
        }
      ]
    };
    this.modelByModelPieOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        datalabels: {
          color: '#222',
          font: { weight: 'bold', size: 12 },
          formatter: (value: any, context: any) => {
            const label = context?.chart?.data?.labels?.[context.dataIndex] as string | undefined;
            const num = typeof value === 'number' ? value : Number(value);
            if (label && (label.toLowerCase().includes('runs') || label.toLowerCase().includes('issues'))) {
              return Number.isFinite(num) ? Math.round(num).toString() : value;
            }
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };
    this.modelByModelPieType = 'pie';

    // Bar chart: all key numeric stats for this model (time shown in seconds)
    const barLabels = ['Total runs', 'Unique issues', 'Avg analysis time (sec)', 'Avg estimated hours'];
    const barValues = [totalRuns, uniqueIssues, avgAnalysisTimeSec, avgEstimatedHours];

    this.modelByModelBarData = {
      labels: barLabels,
      datasets: [
        {
          label: 'Model statistics',
          data: barValues,
          backgroundColor: '#42a5f5',
          borderRadius: 8,
          maxBarThickness: 40
        }
      ]
    };
    this.modelByModelBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          max: this.computeYAxisMax(barValues),
          ticks: { font: { weight: 'bold' } }
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#222',
          font: { weight: 'bold', size: 12 },
          formatter: (value: any, context: any) => {
            const label = context?.chart?.data?.labels?.[context.dataIndex] as string | undefined;
            const num = typeof value === 'number' ? value : Number(value);
            if (label && (label.toLowerCase().includes('runs') || label.toLowerCase().includes('issues'))) {
              return Number.isFinite(num) ? Math.round(num).toString() : value;
            }
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };
    this.modelByModelBarType = 'bar';
  }

  // Prepare charts for Model Comparison tab (Gemini vs DeepSeek, performance dimension)
  private prepareModelComparisonCharts(result: any): void {
    const full = result?.full;
    if (!Array.isArray(full) || !full.length) {
      this.comparisonPerfAvgBarData = null;
      this.comparisonPerfDetailBarData = null;
      this.comparisonRadarData = null;
      this.comparisonRadarOptions = null;
      this.estimationComparisonBarData = null;
      this.estimationComparisonBarOptions = null;
      this.stabilityComparisonPieData = null;
      this.stabilityComparisonPieOptions = null;
      this.qualityVsSpeedScatterData = null;
      this.qualityVsSpeedScatterOptions = null;
      this.compositeScoreBarData = null;
      this.compositeScoreBarOptions = null;
      this.advantageDivergingBarData = null;
      this.advantageDivergingBarOptions = null;
      this.comparisonHeatmapMatrix = null;
      this.responseTimeBoxPlotData = null;
      this.responseTimeBoxPlotRange = null;
      this.speedQualityBubbleData = null;
      this.speedQualityBubbleOptions = null;
      this.estimationRangeStackedData = null;
      this.estimationRangeStackedOptions = null;
      this.stabilitySlopeData = null;
      this.stabilitySlopeOptions = null;
      return;
    }

    const labels = full.map((m: any) => (m.aiProvider === 'GEMINI' ? 'Gemini' : m.aiProvider === 'DEEPSEEK' ? 'DeepSeek' : String(m.aiProvider)));
    const mins = full.map((m: any) => Number(m.minResponseTimeSec ?? 0));
    const avgs = full.map((m: any) => Number(m.avgResponseTimeSec ?? 0));
    const maxs = full.map((m: any) => Number(m.maxResponseTimeSec ?? 0));
    const stds = full.map((m: any) => Number(m.stdDeviationResponseTime ?? 0));

    // Chart A: Average response time per model (simple comparison)
    this.comparisonPerfAvgBarData = {
      labels,
      datasets: [
        {
          data: avgs,
          label: 'Avg response time (s)',
          backgroundColor: ['#60a5fa', '#f59e0b'],
          borderColor: ['#2563eb', '#b45309'],
          borderWidth: 1.5,
          borderRadius: 0,
          maxBarThickness: 28
        }
      ]
    };
    this.comparisonPerfAvgBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#eee' },
          max: this.computeYAxisMax(avgs),
          ticks: { font: { weight: 'bold' } }
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
    this.comparisonPerfAvgBarType = 'bar';

    // Chart B: Detailed distribution (min, avg, max, std dev) per model
    this.comparisonPerfDetailBarData = {
      labels,
      datasets: [
        {
          label: 'Min (s)',
          data: mins,
          backgroundColor: '#60a5fa',
          borderColor: '#2563eb',
          borderWidth: 1.5,
          borderRadius: 0,
          maxBarThickness: 36
        },
        {
          label: 'Avg (s)',
          data: avgs,
          backgroundColor: '#f59e0b',
          borderColor: '#b45309',
          borderWidth: 1.5,
          borderRadius: 0,
          maxBarThickness: 36
        },
        {
          label: 'Max (s)',
          data: maxs,
          backgroundColor: '#f97316',
          borderColor: '#c2410c',
          borderWidth: 1.5,
          borderRadius: 0,
          maxBarThickness: 36
        },
        {
          label: 'Std dev (s)',
          data: stds,
          backgroundColor: '#9ca3af',
          borderColor: '#4b5563',
          borderWidth: 1.5,
          borderRadius: 0,
          maxBarThickness: 36
        }
      ]
    };
    const perfDetailValues: number[] = [...mins, ...avgs, ...maxs, ...stds];

    this.comparisonPerfDetailBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#eee' },
          max: this.computeYAxisMax(perfDetailValues),
          ticks: { font: { weight: 'bold' } }
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
    this.comparisonPerfDetailBarType = 'bar';

    this.buildComparisonRadar(full);
    this.buildEstimationComparisonBar(result?.estimation);
    this.buildStabilityComparisonPie(result?.stability);
    this.buildQualityVsSpeedScatter(full);
    this.buildCompositeScoreBar(full);
    this.buildAdvantageDivergingBar(full);
    this.buildComparisonHeatmap(full);
    this.buildResponseTimeBoxPlot(full);
    this.buildSpeedQualityBubble(full);
    this.buildEstimationRangeStacked(full);
    this.buildStabilitySlopeChart(full);
  }

  private buildComparisonRadar(full: any[]): void {
    if (!Array.isArray(full) || !full.length) {
      this.comparisonRadarData = null;
      this.comparisonRadarOptions = null;
      this.comparisonRadarType = 'radar';
      return;
    }

    const providers = full.map(model => ({
      label: this.formatProviderLabel(model?.aiProvider),
      avgResponseTimeSec: this.toNumber(model?.avgResponseTimeSec),
      avgEstimatedHours: this.toNumber(model?.avgEstimatedHours ?? model?.avgEstimatedHour),
      stabilityScore: this.toNumber(model?.stabilityScore),
      engineeringRelevanceScore: this.toNumber(model?.engineeringRelevanceScore),
      avgResponseLength: this.toNumber(model?.avgResponseLength)
    }));

    if (!providers.length) {
      this.comparisonRadarData = null;
      this.comparisonRadarOptions = null;
      return;
    }

    const responseSpeedValues = providers.map(p => (p.avgResponseTimeSec > 0 ? 1 / p.avgResponseTimeSec : 0));
    const estimationValues = providers.map(p => p.avgEstimatedHours);
    const stabilityValues = providers.map(p => p.stabilityScore);
    const relevanceValues = providers.map(p => p.engineeringRelevanceScore);
    const verbosityValues = providers.map(p => p.avgResponseLength);

    const speedRange = this.range(responseSpeedValues);
    const estRange = this.range(estimationValues);
    const stabilityRange = this.range(stabilityValues);
    const relevanceRange = this.range(relevanceValues);
    const verbosityRange = this.range(verbosityValues);

    this.comparisonRadarData = {
      labels: ['Response Speed', 'Estimation Conservatism', 'Stability', 'Engineering Relevance', 'Response Verbosity'],
      datasets: providers.map((provider, index) => ({
        label: provider.label,
        backgroundColor: this.providerFillColor(index),
        borderColor: this.providerBorderColor(index),
        data: [
          this.normalizeValue(responseSpeedValues[index], speedRange),
          this.normalizeValue(estimationValues[index], estRange),
          this.normalizeValue(stabilityValues[index], stabilityRange),
          this.normalizeValue(relevanceValues[index], relevanceRange),
          this.normalizeValue(verbosityValues[index], verbosityRange)
        ]
      }))
    };

    this.comparisonRadarOptions = {
      responsive: true,
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: 1
        }
      },
      plugins: {
        legend: { position: 'bottom' }
      }
    };
    this.comparisonRadarType = 'radar';
  }

  private buildEstimationComparisonBar(estimation: any): void {
    if (!estimation) {
      this.estimationComparisonBarData = null;
      this.estimationComparisonBarOptions = null;
      return;
    }

    const gemini = this.toNumber(estimation.GEMINI ?? estimation.Gemini);
    const deepseek = this.toNumber(estimation.DEEPSEEK ?? estimation.DeepSeek);
    if (!gemini && !deepseek) {
      this.estimationComparisonBarData = null;
      this.estimationComparisonBarOptions = null;
      return;
    }

    const labels = ['Gemini', 'DeepSeek'];
    const values = [gemini, deepseek];
    this.estimationComparisonBarData = {
      labels,
      datasets: [
        {
          label: 'Avg estimated hours',
          data: values,
          backgroundColor: ['#3b82f6', '#f97316'],
          borderRadius: 8,
          maxBarThickness: 32
        }
      ]
    };
    this.estimationComparisonBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          max: this.computeYAxisMaxWithIncrements(values),
          ticks: { font: { weight: 'bold' } }
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#1e293b',
          font: { weight: 'bold', size: 12 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };
    this.estimationComparisonBarType = 'bar';
  }

  private buildStabilityComparisonPie(stability: any): void {
    if (!stability) {
      this.stabilityComparisonPieData = null;
      this.stabilityComparisonPieOptions = null;
      return;
    }

    const gemini = this.toNumber(stability.GEMINI ?? stability.Gemini);
    const deepseek = this.toNumber(stability.DEEPSEEK ?? stability.DeepSeek);
    if (!gemini && !deepseek) {
      this.stabilityComparisonPieData = null;
      this.stabilityComparisonPieOptions = null;
      return;
    }

    this.stabilityComparisonPieData = {
      labels: ['Gemini', 'DeepSeek'],
      datasets: [
        {
          data: [gemini, deepseek],
          backgroundColor: ['#60a5fa', '#34d399']
        }
      ]
    };
    this.stabilityComparisonPieOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          color: '#0f172a',
          font: { weight: 'bold', size: 12 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        }
      }
    };
    this.stabilityComparisonPieType = 'pie';
  }

  private buildQualityVsSpeedScatter(full: any[]): void {
    if (!Array.isArray(full) || !full.length) {
      this.qualityVsSpeedScatterData = null;
      this.qualityVsSpeedScatterOptions = null;
      return;
    }

    const datasets = full
      .map((model, index) => {
        const avgResponseTimeSec = this.toNumber(model?.avgResponseTimeSec);
        const engineeringRelevanceScore = this.toNumber(model?.engineeringRelevanceScore);
        if (!Number.isFinite(avgResponseTimeSec) || !Number.isFinite(engineeringRelevanceScore)) {
          return null;
        }
        return {
          label: this.formatProviderLabel(model?.aiProvider),
          data: [{ x: avgResponseTimeSec, y: engineeringRelevanceScore }],
          backgroundColor: this.providerBorderColor(index),
          pointRadius: 6
        };
      })
      .filter((dataset): dataset is { label: string; data: { x: number; y: number }[]; backgroundColor: string; pointRadius: number } => !!dataset);

    if (!datasets.length) {
      this.qualityVsSpeedScatterData = null;
      this.qualityVsSpeedScatterOptions = null;
      return;
    }

    this.qualityVsSpeedScatterData = { datasets };
    // Extract Y values from datasets for max calculation
    const yValues = datasets.flatMap(ds => ds.data.map((d: any) => d.y));
    const yAxisMax = this.computeYAxisMaxWithIncrements(yValues);
    this.qualityVsSpeedScatterOptions = {
      responsive: true,
      scales: {
        x: {
          title: { display: false, text: 'Avg response time (s)' },
          beginAtZero: true,
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          title: { display: false, text: 'Engineering relevance score' },
          beginAtZero: true,
          max: yAxisMax,
          ticks: { font: { weight: 'bold' } }
        }
      },
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          anchor: 'end',
          align: 'top',
          offset: 5,
          color: '#1f2937',
          font: { weight: 'bold', size: 13 },
          formatter: (value: any, context: any) => {
            if (context?.datasetIndex === undefined || context?.dataIndex === undefined) {
              return '';
            }
            const data = context.dataset?.data?.[context.dataIndex];
            if (!data || typeof data !== 'object') {
              return '';
            }
            const x = typeof data.x === 'number' ? data.x.toFixed(2) : '0.00';
            const y = typeof data.y === 'number' ? data.y.toFixed(2) : '0.00';
            return `x: ${x}\ny: ${y}`;
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset?.label ?? 'Model';
              const x = context.parsed?.x ?? 0;
              const y = context.parsed?.y ?? 0;
              return `${label}: ${x.toFixed(2)}s, relevance ${y.toFixed(2)}`;
            }
          }
        }
      }
    };
    this.qualityVsSpeedScatterType = 'scatter';
  }

  private buildCompositeScoreBar(full: any[]): void {
    const providers = this.mapComparisonProviders(full);
    if (!providers.length) {
      this.compositeScoreBarData = null;
      this.compositeScoreBarOptions = null;
      return;
    }

    const weights = { speed: 0.3, stability: 0.25, relevance: 0.25, estimation: 0.2 };
    const speedSeries = providers.map(p => p.avgResponseTimeSec);
    const stabilitySeries = providers.map(p => p.stabilityScore);
    const relevanceSeries = providers.map(p => p.engineeringRelevanceScore);
    const estimationSeries = providers.map(p => p.avgEstimatedHours);

    const speedRange = this.range(speedSeries);
    const stabilityRange = this.range(stabilitySeries);
    const relevanceRange = this.range(relevanceSeries);
    const estimationRange = this.range(estimationSeries);

    const scores = providers.map((provider, index) => {
      const speedScore = this.normalizeInverse(speedSeries[index], speedRange);
      const stabilityScore = this.normalizeValue(stabilitySeries[index], stabilityRange);
      const relevanceScore = this.normalizeValue(relevanceSeries[index], relevanceRange);
      const estimationScore = this.normalizeInverse(estimationSeries[index], estimationRange);
      const composite =
        speedScore * weights.speed +
        stabilityScore * weights.stability +
        relevanceScore * weights.relevance +
        estimationScore * weights.estimation;
      return Number.isFinite(composite) ? Number(composite.toFixed(3)) : 0;
    });

    this.compositeScoreBarData = {
      labels: providers.map(p => p.label),
      datasets: [
        {
          label: 'Composite decision score',
          data: scores,
          backgroundColor: providers.map((_, index) => this.providerSolidColor(index)),
          borderRadius: 8,
          maxBarThickness: 36
        }
      ]
    };
    this.compositeScoreBarOptions = {
      responsive: true,
      scales: {
        x: {
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          beginAtZero: true,
          suggestedMax: 1,
          ticks: { font: { weight: 'bold' } }
        }
      },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#0f172a',
          font: { weight: 'bold', size: 12 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) ? num.toFixed(2) : value;
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label ?? 'Model';
              const value = context.parsed?.y ?? context.parsed ?? 0;
              return `${label}: composite ${value.toFixed(2)}`;
            }
          }
        }
      }
    };
    this.compositeScoreBarType = 'bar';
  }

  private buildAdvantageDivergingBar(full: any[]): void {
    const providers = this.mapComparisonProviders(full);
    if (providers.length < 2) {
      this.advantageDivergingBarData = null;
      this.advantageDivergingBarOptions = null;
      return;
    }

    const sorted = [...providers].sort((a, b) => a.label.localeCompare(b.label));
    const [primary, secondary] = sorted;

    const speedSeries = sorted.map(p => p.avgResponseTimeSec);
    const stabilitySeries = sorted.map(p => p.stabilityScore);
    const relevanceSeries = sorted.map(p => p.engineeringRelevanceScore);
    const estimationSeries = sorted.map(p => p.avgEstimatedHours);

    const speedRange = this.range(speedSeries);
    const stabilityRange = this.range(stabilitySeries);
    const relevanceRange = this.range(relevanceSeries);
    const estimationRange = this.range(estimationSeries);

    const diffs = [
      {
        label: 'Speed advantage',
        value: this.normalizeInverse(speedSeries[0], speedRange) - this.normalizeInverse(speedSeries[1], speedRange)
      },
      {
        label: 'Stability advantage',
        value: this.normalizeValue(stabilitySeries[0], stabilityRange) - this.normalizeValue(stabilitySeries[1], stabilityRange)
      },
      {
        label: 'Engineering depth',
        value: this.normalizeValue(relevanceSeries[0], relevanceRange) - this.normalizeValue(relevanceSeries[1], relevanceRange)
      },
      {
        label: 'Estimation discipline',
        value: this.normalizeInverse(estimationSeries[0], estimationRange) - this.normalizeInverse(estimationSeries[1], estimationRange)
      }
    ];

    this.advantageDivergingBarData = {
      labels: diffs.map(diff => diff.label),
      datasets: [
        {
          label: `${primary.label} advantage vs ${secondary.label}`,
          data: diffs.map(diff => Number(diff.value.toFixed(3))),
          backgroundColor: diffs.map(diff => (diff.value >= 0 ? '#22c55e' : '#ef4444')),
          borderRadius: 6,
          maxBarThickness: 32
        }
      ]
    };
    this.advantageDivergingBarOptions = {
      indexAxis: 'y',
      responsive: true,
      scales: {
        x: {
          suggestedMin: -1,
          suggestedMax: 1,
          grid: { color: '#e2e8f0' },
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          ticks: { font: { weight: 'bold' } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset?.label ?? 'Advantage';
              const value = context.parsed?.x ?? context.raw ?? 0;
              const direction = value >= 0 ? primary.label : secondary.label;
              return `${label}: ${direction} +${Math.abs(value).toFixed(2)}`;
            }
          }
        }
      }
    };
    this.advantageDivergingBarType = 'bar';
  }

  private buildComparisonHeatmap(full: any[]): void {
    const providers = this.mapComparisonProviders(full);
    if (!providers.length) {
      this.comparisonHeatmapMatrix = null;
      return;
    }

    const speedSeries = providers.map(p => p.avgResponseTimeSec);
    const stabilitySeries = providers.map(p => p.stabilityScore);
    const relevanceSeries = providers.map(p => p.engineeringRelevanceScore);
    const estimationSeries = providers.map(p => p.avgEstimatedHours);
    const verbositySeries = providers.map(p => p.avgResponseLength);

    const speedRange = this.range(speedSeries);
    const stabilityRange = this.range(stabilitySeries);
    const relevanceRange = this.range(relevanceSeries);
    const estimationRange = this.range(estimationSeries);
    const verbosityRange = this.range(verbositySeries);

    this.comparisonHeatmapMatrix = providers.map((provider, index) => ({
      label: provider.label,
      metrics: [
        {
          key: 'speed',
          label: 'Response speed',
          value: provider.avgResponseTimeSec,
          normalized: this.normalizeInverse(speedSeries[index], speedRange)
        },
        {
          key: 'stability',
          label: 'Stability score',
          value: provider.stabilityScore,
          normalized: this.normalizeValue(stabilitySeries[index], stabilityRange)
        },
        {
          key: 'relevance',
          label: 'Engineering relevance',
          value: provider.engineeringRelevanceScore,
          normalized: this.normalizeValue(relevanceSeries[index], relevanceRange)
        },
        {
          key: 'estimation',
          label: 'Estimation efficiency',
          value: provider.avgEstimatedHours,
          normalized: this.normalizeInverse(estimationSeries[index], estimationRange)
        },
        {
          key: 'verbosity',
          label: 'Response verbosity',
          value: provider.avgResponseLength,
          normalized: this.normalizeValue(verbositySeries[index], verbosityRange)
        }
      ]
    }));
  }

  private buildResponseTimeBoxPlot(full: any[]): void {
    const providers = this.mapComparisonProviders(full);
    if (!providers.length) {
      this.responseTimeBoxPlotData = null;
      this.responseTimeBoxPlotRange = null;
      return;
    }

    const boxes = providers
      .map(provider => {
        const min = provider.minResponseTimeSec;
        const max = provider.maxResponseTimeSec;
        const median = provider.avgResponseTimeSec;
        const std = provider.stdDeviationResponseTime;
        if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
          return null;
        }
        const q1 = this.clamp(median - std, min, max);
        const q3 = this.clamp(median + std, min, max);
        return {
          label: provider.label,
          min,
          q1,
          median,
          q3,
          max
        };
      })
      .filter((box): box is { label: string; min: number; q1: number; median: number; q3: number; max: number } => !!box);

    if (!boxes.length) {
      this.responseTimeBoxPlotData = null;
      this.responseTimeBoxPlotRange = null;
      return;
    }

    const globalMin = Math.min(...boxes.map(box => box.min));
    const globalMax = Math.max(...boxes.map(box => box.max));
    this.responseTimeBoxPlotData = boxes;
    this.responseTimeBoxPlotRange = { min: globalMin, max: globalMax };
  }

  private buildSpeedQualityBubble(full: any[]): void {
    const providers = this.mapComparisonProviders(full);
    const datasets = providers
      .map((provider, index) => {
        if (!Number.isFinite(provider.avgResponseTimeSec) || !Number.isFinite(provider.engineeringRelevanceScore)) {
          return null;
        }
        const stabilityRadius = provider.stabilityScore > 0 ? Math.max(6, provider.stabilityScore * 10) : 6;
        return {
          label: provider.label,
          data: [
            {
              x: provider.avgResponseTimeSec,
              y: provider.engineeringRelevanceScore,
              r: stabilityRadius
            }
          ],
          backgroundColor: this.providerSolidColor(index),
          borderColor: this.providerBorderColor(index),
          borderWidth: 1,
          hoverRadius: stabilityRadius + 2
        };
      })
      .filter((dataset: { label: string; data: { x: number; y: number; r: number }[]; backgroundColor: string; borderColor: string; borderWidth: number; hoverRadius: number } | null): dataset is {
        label: string;
        data: { x: number; y: number; r: number }[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
        hoverRadius: number;
      } => !!dataset);

    if (!datasets.length) {
      this.speedQualityBubbleData = null;
      this.speedQualityBubbleOptions = null;
      return;
    }

    this.speedQualityBubbleData = { datasets };
    // Extract Y values from datasets for max calculation
    const yValues = datasets.flatMap(ds => ds.data.map((d: any) => d.y));
    const yAxisMax = this.computeYAxisMaxWithIncrements(yValues);
    this.speedQualityBubbleOptions = {
      responsive: true,
      scales: {
        x: {
          title: { display: false, text: 'Avg response time (s)' },
          beginAtZero: true,
          ticks: { font: { weight: 'bold' } }
        },
        y: {
          title: { display: false, text: 'Engineering relevance' },
          beginAtZero: true,
          max: yAxisMax,
          ticks: { font: { weight: 'bold' } }
        }
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top',
          offset: 5,
          color: '#1f2937',
          font: { weight: 'bold', size: 13 },
          formatter: (value: any, context: any) => {
            if (!value || typeof value !== 'object') {
              return '';
            }
            const x = typeof value.x === 'number' ? value.x.toFixed(2) : '0.00';
            const y = typeof value.y === 'number' ? value.y.toFixed(2) : '0.00';
            return `x: ${x}\ny: ${y}`;
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset?.label ?? 'Model';
              const point = context.raw ?? context.parsed;
              if (!point) {
                return label;
              }
              return `${label}: ${point.x.toFixed(2)}s, relevance ${point.y.toFixed(2)}, stability radius ${point.r}`;
            }
          }
        },
        legend: { position: 'bottom' }
      }
    };
    this.speedQualityBubbleType = 'bubble';
  }

  private buildEstimationRangeStacked(full: any[]): void {
    const providers = this.mapComparisonProviders(full);
    if (!providers.length) {
      this.estimationRangeStackedData = null;
      this.estimationRangeStackedOptions = null;
      return;
    }

    const labels = providers.map(p => p.label);
    const minSegments: number[] = [];
    const midSegments: number[] = [];
    const topSegments: number[] = [];
    providers.forEach(provider => {
      const min = provider.minEstimatedHours > 0 ? provider.minEstimatedHours : provider.avgEstimatedHours;
      const avg = provider.avgEstimatedHours > 0 ? provider.avgEstimatedHours : min;
      const max = provider.maxEstimatedHours > 0 ? provider.maxEstimatedHours : avg;
      const clampedMin = Math.min(min, avg);
      const clampedMax = Math.max(max, avg);
      minSegments.push(clampedMin);
      midSegments.push(Math.max(0, avg - clampedMin));
      topSegments.push(Math.max(0, clampedMax - avg));
    });

    const totals = providers.map((_, index) => minSegments[index] + midSegments[index] + topSegments[index]);
    const yMax = this.computeYAxisMax(totals);

    this.estimationRangeStackedData = {
      labels,
      datasets: [
        {
          label: 'Minimum hours',
          data: minSegments,
          backgroundColor: '#3b82f6',
          stack: 'estRange'
        },
        {
          label: 'Avg delta',
          data: midSegments,
          backgroundColor: '#06b6d4',
          stack: 'estRange'
        },
        {
          label: 'Tail risk',
          data: topSegments,
          backgroundColor: '#ec4899',
          stack: 'estRange'
        }
      ]
    };
    this.estimationRangeStackedOptions = {
      responsive: true,
      scales: {
        y: { 
          stacked: true, 
          beginAtZero: true, 
          max: yMax,
          grid: { display: true, drawBorder: true },
          ticks: {
            stepSize: this.getYAxisConfig(totals).stepSize
          }
        },
        x: { stacked: true }
      },
      plugins: {
        legend: { position: 'bottom' },
        datalabels: {
          anchor: 'center',
          align: 'center',
          color: '#fff',
          font: { weight: 'bold', size: 11 },
          formatter: (value: any) => {
            const num = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(num) && num > 0 ? num.toFixed(2) : '';
          }
        }
      }
    };
    this.estimationRangeStackedType = 'bar';
  }

  private buildStabilitySlopeChart(full: any[]): void {
    const providers = this.mapComparisonProviders(full);
    if (!providers.length) {
      this.stabilitySlopeData = null;
      this.stabilitySlopeOptions = null;
      return;
    }

    const labels = ['Avg response (s)', 'Stability-adjusted (s)'];
    const datasets = providers
      .map((provider, index) => {
        const avg = provider.avgResponseTimeSec;
        const stability = provider.stabilityScore;
        if (!Number.isFinite(avg) || avg <= 0) {
          return null;
        }
        const normalizedStability = stability > 1 ? stability / 100 : stability;
        const adjustmentFactor = 1 - this.clamp(normalizedStability, 0, 1) * 0.35;
        const adjusted = Number((avg * adjustmentFactor).toFixed(3));
        return {
          label: provider.label,
          data: [Number(avg.toFixed(3)), adjusted],
          borderColor: this.providerBorderColor(index),
          backgroundColor: this.providerFillColor(index),
          pointBackgroundColor: this.providerBorderColor(index),
          tension: 0.3,
          fill: false
        };
      })
      .filter((dataset: { label: string; data: number[]; borderColor: string; backgroundColor: string; pointBackgroundColor: string; tension: number; fill: boolean } | null): dataset is {
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        pointBackgroundColor: string;
        tension: number;
        fill: boolean;
      } => !!dataset);

    if (!datasets.length) {
      this.stabilitySlopeData = null;
      this.stabilitySlopeOptions = null;
      return;
    }

    this.stabilitySlopeData = { labels, datasets };
    this.stabilitySlopeOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.dataset?.label ?? 'Model';
              const value = context.parsed?.y ?? context.parsed ?? 0;
              return `${label}: ${value.toFixed(2)}s`;
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    };
    this.stabilitySlopeType = 'line';
  }

  private range(values: number[]): { min: number; max: number } {
    const finite = values.filter(v => Number.isFinite(v));
    if (!finite.length) {
      return { min: 0, max: 1 };
    }
    return {
      min: Math.min(...finite),
      max: Math.max(...finite)
    };
  }

  private normalizeValue(value: number, range: { min: number; max: number }): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    const span = range.max - range.min;
    if (span <= 0) {
      return 1;
    }
    return (value - range.min) / span;
  }

  private providerFillColor(index: number): string {
    const palette = this.providerPalette[index % this.providerPalette.length];
    return palette.fill;
  }

  private providerBorderColor(index: number): string {
    const palette = this.providerPalette[index % this.providerPalette.length];
    return palette.border;
  }

  private providerSolidColor(index: number): string {
    const palette = this.providerPalette[index % this.providerPalette.length];
    return palette.solid ?? palette.border;
  }

  private mapComparisonProviders(full: any[]): Array<{
    label: string;
    avgResponseTimeSec: number;
    minResponseTimeSec: number;
    maxResponseTimeSec: number;
    stdDeviationResponseTime: number;
    avgEstimatedHours: number;
    minEstimatedHours: number;
    maxEstimatedHours: number;
    stabilityScore: number;
    engineeringRelevanceScore: number;
    avgResponseLength: number;
  }> {
    if (!Array.isArray(full)) {
      return [];
    }

    return full
      .map(model => ({
        label: this.formatProviderLabel(model?.aiProvider),
        avgResponseTimeSec: this.toNumber(model?.avgResponseTimeSec),
        minResponseTimeSec: this.toNumber(model?.minResponseTimeSec ?? model?.minResponseSec),
        maxResponseTimeSec: this.toNumber(model?.maxResponseTimeSec ?? model?.maxResponseSec),
        stdDeviationResponseTime: this.toNumber(model?.stdDeviationResponseTime ?? model?.stdDevResponseTime ?? model?.stdResponseTime),
        avgEstimatedHours: this.toNumber(model?.avgEstimatedHours ?? model?.avgEstimatedHour),
        minEstimatedHours: this.toNumber(model?.minEstimatedHours ?? model?.minHours ?? model?.minEstimatedHour),
        maxEstimatedHours: this.toNumber(model?.maxEstimatedHours ?? model?.maxHours ?? model?.maxEstimatedHour),
        stabilityScore: this.toNumber(model?.stabilityScore ?? model?.stability ?? model?.stabilityIndex),
        engineeringRelevanceScore: this.toNumber(model?.engineeringRelevanceScore ?? model?.relevanceScore ?? model?.engRelevance),
        avgResponseLength: this.toNumber(model?.avgResponseLength ?? model?.avgTokens ?? model?.avgWords)
      }))
      .filter(provider => provider.label.trim().length > 0);
  }

  private normalizeInverse(value: number, range: { min: number; max: number }): number {
    if (!Number.isFinite(value)) {
      return 0;
    }
    const span = range.max - range.min;
    if (span <= 0) {
      return 1;
    }
    return 1 - (value - range.min) / span;
  }

  private clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  }

  private formatProviderLabel(provider: any): string {
    const raw = String(provider ?? '').trim();
    const upper = raw.toUpperCase();
    switch (upper) {
      case 'GEMINI':
        return 'Gemini';
      case 'DEEPSEEK':
        return 'DeepSeek';
      default:
        return raw || 'Provider';
    }
  }

  private toNumber(value: any): number {
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  // Utility: compute a nice Y-axis max with dynamic step sizing
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

  // Utility: compute Y-axis max by extending the data maximum by 2 increments
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


  get stabilityIssueLabel(): string {
    return (this.evaluationResult?.issueKey ?? this.stabilityIssueKey ?? '').trim();
  }

  selectTab(tab: 'by-issue' | 'comparison' | 'by-model' | 'features' | 'stability'): void {
    this.activeEvaluationTab = tab;
  }
}
