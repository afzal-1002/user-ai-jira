import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EstimationHistoryRecord } from '../../services/ai/ai-history.service';
import { BarComparisonChartComponent } from '../../shared/charts/bar-comparison-chart.component';

interface ComparisonRow {
  issueKey: string;
  actualHours: number;
  geminiEst?: number;
  deepSeekEst?: number;
  betterModel: 'GEMINI' | 'DEEPSEEK' | 'TIE' | 'N/A';
}

@Component({
  selector: 'app-historical-model-comparison',
  standalone: true,
  imports: [CommonModule, BarComparisonChartComponent],
  templateUrl: './historical-model-comparison.component.html',
  styleUrls: ['./historical-model-comparison.component.css']
})
export class HistoricalModelComparisonComponent {
  @Input() history: EstimationHistoryRecord[] = [];

  private get groupedByIssue(): Map<string, EstimationHistoryRecord[]> {
    const map = new Map<string, EstimationHistoryRecord[]>();
    for (const r of this.history) {
      if (!r.issueKey) continue;
      const key = r.issueKey;
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return map;
  }

  get rows(): ComparisonRow[] {
    const out: ComparisonRow[] = [];
    for (const [issueKey, recs] of this.groupedByIssue.entries()) {
      const actual = recs.find((r) => r.actualHours != null)?.actualHours;
      if (actual == null) continue;
      const gem = recs.find((r) => r.aiProvider?.toUpperCase() === 'GEMINI');
      const ds = recs.find((r) => r.aiProvider?.toUpperCase() === 'DEEPSEEK');
      if (!gem && !ds) continue;

      const gemErr = gem ? Math.abs((gem.estimatedHours ?? 0) - actual) : null;
      const dsErr = ds ? Math.abs((ds.estimatedHours ?? 0) - actual) : null;

      let better: ComparisonRow['betterModel'] = 'N/A';
      if (gemErr != null && dsErr != null) {
        if (Math.abs(gemErr - dsErr) < 1e-6) better = 'TIE';
        else better = gemErr < dsErr ? 'GEMINI' : 'DEEPSEEK';
      } else if (gemErr != null) {
        better = 'GEMINI';
      } else if (dsErr != null) {
        better = 'DEEPSEEK';
      }

      out.push({
        issueKey,
        actualHours: actual,
        geminiEst: gem?.estimatedHours,
        deepSeekEst: ds?.estimatedHours,
        betterModel: better
      });
    }
    return out;
  }

  get geminiWins(): number {
    return this.rows.filter((r) => r.betterModel === 'GEMINI').length;
  }

  get deepSeekWins(): number {
    return this.rows.filter((r) => r.betterModel === 'DEEPSEEK').length;
  }

  get labels(): string[] {
    return ['Gemini wins', 'DeepSeek wins'];
  }

  get values(): number[] {
    return [this.geminiWins, this.deepSeekWins];
  }
}
