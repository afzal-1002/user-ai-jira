import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-line-trend-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg *ngIf="points?.length" viewBox="0 0 100 40" class="line-chart">
      <polyline
        [attr.points]="polylinePoints"
        fill="none"
        stroke="#1d4ed8"
        stroke-width="1.5"
      ></polyline>
    </svg>
  `,
  styles: [
    `.line-chart { width: 100%; height: 220px; }`
  ]
})
export class LineTrendChartComponent {
  @Input() points: number[] = [];

  get polylinePoints(): string {
    if (!this.points.length) return '';
    const max = this.points.reduce((m, v) => (v > m ? v : m), 0) || 1;
    const stepX = this.points.length > 1 ? 100 / (this.points.length - 1) : 0;
    return this.points
      .map((v, i) => {
        const x = stepX * i;
        const y = 40 - (v / max) * 35;
        return `${x},${y}`;
      })
      .join(' ');
  }
}
