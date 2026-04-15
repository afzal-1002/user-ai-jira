import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-grouped-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grouped-bar-chart" *ngIf="categories?.length && seriesAValues?.length && seriesBValues?.length">
      <div class="group" *ngFor="let cat of categories; let i = index">
        <div class="group-bars">
          <div class="bar-wrapper">
            <div class="bar-value">{{ seriesAValues[i] | number: '1.1-2' }}</div>
            <div
              class="bar bar-a"
              [style.height.%]="maxValue ? (seriesAValues[i] / maxValue) * 100 : 0"
            ></div>
            <div class="bar-caption">{{ seriesALabel }}</div>
          </div>
          <div class="bar-wrapper">
            <div class="bar-value">{{ seriesBValues[i] | number: '1.1-2' }}</div>
            <div
              class="bar bar-b"
              [style.height.%]="maxValue ? (seriesBValues[i] / maxValue) * 100 : 0"
            ></div>
            <div class="bar-caption">{{ seriesBLabel }}</div>
          </div>
        </div>
        <div class="group-label">{{ cat }}</div>
      </div>
    </div>
  `,
  styles: [
  `.grouped-bar-chart { display: flex; gap: 2rem; align-items: flex-end; height: 440px; margin-top: 2rem; }`,
  `.group { flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }`,
    `.group-label { margin-top: 0.35rem; font-size: 0.8rem; font-weight: 500; }`,
    `.group-bars { display: flex; justify-content: center; gap: 0.5rem; align-items: flex-end; height: 80%; }`,
    `.bar-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 0.3rem; height: 100%; }`,
    `.bar { width: 70px; border-radius: 0; min-height: 40px; }`,
    `.bar-a { background: linear-gradient(to top, #22c55e, #16a34a); }`,
    `.bar-b { background: linear-gradient(to top, #1d4ed8, #60a5fa); }`,
    `.bar-caption { font-size: 0.7rem; color: #6b7280; }`,
    `.bar-value { font-size: 0.75rem; color: #374151; font-weight: 500; }`
  ]
})
export class GroupedBarChartComponent {
  @Input() categories: string[] = [];
  @Input() seriesALabel = '';
  @Input() seriesBLabel = '';
  @Input() seriesAValues: number[] = [];
  @Input() seriesBValues: number[] = [];

  get maxValue(): number {
    const all = [...this.seriesAValues, ...this.seriesBValues];
    return all.reduce((m, v) => (v > m ? v : m), 0) || 0;
  }
}
