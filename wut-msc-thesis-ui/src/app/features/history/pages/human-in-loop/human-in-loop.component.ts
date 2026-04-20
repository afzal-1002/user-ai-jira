import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HistoryService } from '../../services/history.service';
import { HumanInLoopHistoryResult } from '../../models/history.models';
import { GroupedBarChartComponent } from '../../../../shared/charts/grouped-bar-chart.component';

@Component({
  selector: 'app-human-in-loop',
  standalone: true,
  imports: [CommonModule, GroupedBarChartComponent],
  templateUrl: './human-in-loop.component.html',
  styleUrls: ['./human-in-loop.component.scss']
})
export class HumanInLoopComponent implements OnInit {
  isLoading = false;
  error = '';
  results: HumanInLoopHistoryResult[] = [];

  constructor(private historyService: HistoryService, private router: Router) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    this.historyService.getHumanInLoop().subscribe({
      next: (data) => {
        this.results = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load human-in-the-loop history', err);
        this.error = 'Failed to load human-in-the-loop history.';
        this.isLoading = false;
      }
    });
  }

  private group() {
    const withPrompt = this.results.filter((r) => r.userPromptProvided);
    const withoutPrompt = this.results.filter((r) => !r.userPromptProvided);

    const avg = (arr: HumanInLoopHistoryResult[]) => {
      if (!arr.length) return { error: 0, variance: 0 };
      const errVals = arr.map((r) => r.avgError);
      const mean = errVals.reduce((s, v) => s + v, 0) / errVals.length;
      const variance =
        errVals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / errVals.length;
      return { error: mean, variance };
    };

    return {
      withPrompt: avg(withPrompt),
      withoutPrompt: avg(withoutPrompt)
    };
  }

  get categories(): string[] {
    return ['With user prompt', 'Without user prompt'];
  }

  get seriesALabel(): string {
    return 'Avg error (hours)';
  }

  get seriesBLabel(): string {
    return 'Error variance';
  }

  get seriesAValues(): number[] {
    const g = this.group();
    return [g.withPrompt.error, g.withoutPrompt.error];
  }

  get seriesBValues(): number[] {
    const g = this.group();
    return [g.withPrompt.variance, g.withoutPrompt.variance];
  }

  goBack(): void {
    this.router.navigate(['/history']);
  }
}
