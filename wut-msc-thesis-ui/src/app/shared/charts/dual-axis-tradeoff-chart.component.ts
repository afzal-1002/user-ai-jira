import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dual-axis-tradeoff-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dual-axis-chart" *ngIf="labels?.length && quality?.length && latency?.length">
      <div class="dual-axis-row" *ngFor="let label of labels; let i = index">
        <div class="dual-axis-label">{{ label }}</div>
        <div class="dual-axis-bars">
          <div class="quality-track">
            <div class="quality-fill" [style.width.%]="maxQuality ? (quality[i] / maxQuality) * 100 : 0"></div>
          </div>
          <div class="latency-track">
            <div class="latency-fill" [style.width.%]="maxLatency ? (latency[i] / maxLatency) * 100 : 0"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `.dual-axis-chart { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8rem; }`,
    `.dual-axis-row { display: flex; align-items: center; gap: 0.5rem; }`,
    `.dual-axis-label { width: 100px; }`,
    `.dual-axis-bars { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }`,
    `.quality-track, .latency-track { height: 8px; background-color: #e5e7eb; border-radius: 999px; overflow: hidden; }`,
    `.quality-fill { height: 100%; background: linear-gradient(to right, #22c55e, #16a34a); }`,
    `.latency-fill { height: 100%; background: linear-gradient(to right, #1d4ed8, #60a5fa); }`
  ]
})
export class DualAxisTradeoffChartComponent {
  @Input() labels: string[] = [];
  @Input() quality: number[] = [];
  @Input() latency: number[] = [];

  get maxQuality(): number {
    return this.quality.reduce((m, v) => (v > m ? v : m), 0) || 0;
  }

  get maxLatency(): number {
    return this.latency.reduce((m, v) => (v > m ? v : m), 0) || 0;
  }
}
