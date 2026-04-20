import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-variance-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="variance-chart" *ngIf="variances?.length">
    <div class="variance-layout">
    <div class="variance-axis"></div>
    <div class="variance-items">
      <div class="variance-item" *ngFor="let v of variances">
      <div class="variance-label">{{ v.label }}</div>
      <div class="variance-bar-row">
        <div class="variance-bar-outer">
        <div
          class="variance-bar-inner"
          [style.width.%]="maxValue ? (v.value / maxValue) * 100 : 0"
        ></div>
        </div>
        <div class="variance-value">{{ v.value | number: '1.1-2' }}</div>
      </div>
      </div>
    </div>
    </div>
  </div>
  `,
  styles: [
  `.variance-chart { font-size: 0.85rem; }`,
  `.variance-layout { display: flex; align-items: stretch; gap: 1.25rem; }`,
  `.variance-axis { width: 1px; background-color: #9ca3af; margin-left: 0.25rem; }`,
  `.variance-items { flex: 1; display: flex; flex-direction: column; gap: 1.1rem; }`,
  `.variance-item { display: flex; flex-direction: column; }`,
  `.variance-label { margin-bottom: 0.3rem; font-weight: 500; }`,
  `.variance-bar-row { display: flex; align-items: center; gap: 0.8rem; }`,
  `.variance-bar-outer { flex: 1; border: 1px solid #9ca3af; border-radius: 4px; background-color: #f9fafb; height: 34px; overflow: hidden; }`,
  `.variance-bar-inner { height: 100%; background: linear-gradient(to right, #22c55e, #3b82f6); }`,
  `.variance-value { font-weight: 500; color: #111827; min-width: 3.2rem; text-align: right; }`
  ]
})
export class VarianceChartComponent {
  @Input() variances: { label: string; value: number }[] = [];

  get maxValue(): number {
    return this.variances.reduce((m, v) => (v.value > m ? v.value : m), 0) || 0;
  }
}
