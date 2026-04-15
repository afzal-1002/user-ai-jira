import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-ai-eval-by-issue',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './ai-eval-by-issue.component.html',
  styleUrls: ['./ai-eval-by-issue.component.css']
})
export class AiEvalByIssueComponent implements OnChanges {

  /* UI state */
  @Input() isLoading = false;
  @Input() error = '';
  @Input() hasProviderStats = false;
  @Input() maxProviderAvgHours = 0;
  @Input() evaluationResult: any;

  /* Charts (raw from parent / API) */
  @Input() providerBarData: any;
  @Input() providerBarOptions: any;
  @Input() providerBarType: any = 'bar';

  @Input() byIssueTimeBarData: any;
  @Input() byIssueTimeBarOptions: any;
  @Input() byIssueTimeBarType: any = 'bar';

  @Input() byIssueAllStatsBarData: any;
  @Input() byIssueAllStatsBarOptions: any;
  @Input() byIssueAllStatsBarType: any = 'bar';

  @Input() byIssueOverallBarData: any;
  @Input() byIssueOverallBarOptions: any;
  @Input() byIssueOverallBarType: any = 'bar';

  pieProviderRunsData: any;
pieProviderRunsOptions: any;
pieProviderRunsType: any = 'pie';

radarModelComparisonData: any;
radarModelComparisonOptions: any;
radarModelComparisonType: any = 'radar';

lineEstimationRangeData: any;
lineEstimationRangeOptions: any;
lineEstimationRangeType: any = 'line';


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['providerBarData']) {
      this.providerBarData = this.decorateBarData(this.providerBarData);
    }

    if (changes['byIssueTimeBarData']) {
      this.byIssueTimeBarData = this.decorateBarData(this.byIssueTimeBarData);
    }

    if (changes['byIssueAllStatsBarData']) {
      this.byIssueAllStatsBarData = this.decorateBarData(this.byIssueAllStatsBarData);
    }

    if (changes['byIssueOverallBarData']) {
      this.byIssueOverallBarData = this.decorateSingleDatasetBar(this.byIssueOverallBarData);
    }

    if (changes['evaluationResult'] && this.evaluationResult) {
      this.buildExtraCharts(this.evaluationResult);
    }
  }

  /**
   * Builds supplemental visualizations (pie/radar/line)
   * once raw evaluation data arrives.
   */
  buildExtraCharts(result: any): void {
    if (!result) {
      this.pieProviderRunsData = null;
      this.radarModelComparisonData = null;
      this.lineEstimationRangeData = null;
      return;
    }

    const providers = result.providers || {};
    const gem = providers.GEMINI || providers.Gemini || {};
    const deep = providers.DEEPSEEK || providers.DeepSeek || {};

    const gRuns = Number(gem.runs ?? 0);
    const dRuns = Number(deep.runs ?? 0);

    const gAvgH = Number(gem.avgHours ?? gem.avghours ?? 0);
    const dAvgH = Number(deep.avgHours ?? deep.avghours ?? 0);

    const gAvgSec = Number(gem.avgTimeMs ?? gem.avgTimeMS ?? 0) / 1000;
    const dAvgSec = Number(deep.avgTimeMs ?? deep.avgTimeMS ?? 0) / 1000;

    const minH = Number(result.minEstimatedHours ?? result.minHours ?? 0);
    const avgH = Number(result.avgEstimatedHours ?? result.avgHours ?? 0);
    const maxH = Number(result.maxEstimatedHours ?? result.maxHours ?? 0);

    /* ---------- PIE: Provider usage ---------- */
    this.pieProviderRunsData = {
      labels: ['Gemini', 'DeepSeek'],
      datasets: [
        {
          data: [gRuns, dRuns],
          backgroundColor: ['#2563eb', '#22c55e']
        }
      ]
    };

    this.pieProviderRunsOptions = {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    };

    /* ---------- RADAR: Multi-criteria ---------- */
    this.radarModelComparisonData = {
      labels: ['Estimation depth', 'Response speed', 'Usage frequency'],
      datasets: [
        {
          label: 'Gemini',
          data: [gAvgH, this.safeInverse(gAvgSec), gRuns],
          backgroundColor: 'rgba(37,99,235,0.25)',
          borderColor: '#2563eb'
        },
        {
          label: 'DeepSeek',
          data: [dAvgH, this.safeInverse(dAvgSec), dRuns],
          backgroundColor: 'rgba(34,197,94,0.25)',
          borderColor: '#22c55e'
        }
      ]
    };

    this.radarModelComparisonOptions = {
      responsive: true,
      scales: { r: { beginAtZero: true } }
    };

    /* ---------- LINE: Estimation window ---------- */
    this.lineEstimationRangeData = {
      labels: ['Min', 'Average', 'Max'],
      datasets: [
        {
          label: 'Estimated hours',
          data: [minH, avgH, maxH],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.2)',
          tension: 0.3,
          fill: true
        }
      ]
    };

    this.lineEstimationRangeOptions = {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    };
  }

  /* ---------- Helpers ---------- */

  /**
   * For MULTI-DATASET bar charts
   */
  private decorateBarData(data: any): any {
    if (!data?.datasets) return data;

    return {
      ...data,
      datasets: data.datasets.map((ds: any, index: number) => ({
        ...ds,

        /* 🔹 Slim bars */
        categoryPercentage: 0.45,
        barPercentage: 0.5,
        borderRadius: 6,

        /* 🔹 Color safety (if API doesn’t provide) */
        backgroundColor:
          ds.backgroundColor ??
          this.defaultColors[index % this.defaultColors.length]
      }))
    };
  }

  /**
   * For SINGLE-DATASET bar charts (Overall Issue Summary)
   * This is the CRITICAL fix.
   */
  private decorateSingleDatasetBar(data: any): any {
    if (!data?.datasets?.length) return data;

    return {
      ...data,
      datasets: data.datasets.map((ds: any) => ({
        ...ds,

        /* 🔥 THIS fixes thick bars */
        barThickness: 28,
        maxBarThickness: 32,
        borderRadius: 6,

        backgroundColor:
          ds.backgroundColor ??
          ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
      }))
    };
  }

  private safeInverse(value: number): number {
    if (!Number.isFinite(value) || value === 0) {
      return 0;
    }
    return Number((1 / value).toFixed(4));
  }

  private defaultColors = ['#22c55e', '#2563eb', '#f59e0b', '#ef4444'];
}
