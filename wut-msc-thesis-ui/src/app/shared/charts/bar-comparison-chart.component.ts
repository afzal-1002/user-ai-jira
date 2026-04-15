import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-bar-comparison-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bar-chart" *ngIf="labels?.length && values?.length">
      <div class="bar" *ngFor="let label of labels; let i = index">
        <div
          class="bar-fill"
          [style.height.%]="maxValue ? (values[i] / maxValue) * 100 : 0"
        ></div>
        <div class="bar-label">{{ label }}</div>
        <div class="bar-value">{{ values[i] | number: '1.1-2' }}</div>
      </div>
    </div>
  `,
  styles: [
    `.bar-chart { display: flex; align-items: flex-end; gap: 1rem; height: 220px; }`,
    `.bar { flex: 1; text-align: center; }`,
    `.bar-fill { width: 60%; margin: 0 auto; border-radius: 6px 6px 0 0; background: linear-gradient(to top, #22c55e, #16a34a); }`,
    `.bar-label { margin-top: 0.25rem; font-size: 0.8rem; }`,
    `.bar-value { font-size: 0.75rem; color: #6b7280; }`
  ]
})
export class BarComparisonChartComponent {
  @Input() labels: string[] = [];
  @Input() values: number[] = [];

  get maxValue(): number {
    return this.values.reduce((m, v) => (v > m ? v : m), 0) || 0;
  }
}
