import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ai-response-extremes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-response-extremes.component.html',
  styleUrls: ['./ai-response-extremes.component.css']
})
export class AiResponseExtremesComponent {
  @Input() isLoading = false;
  @Input() error = '';
  @Input() summary: {
    recommendation?: string;
    fastestModel?: string;
    slowestModel?: string;
    fastestValue?: number | string;
    slowestValue?: number | string;
    deltaSeconds?: number | string;
  } | null = null;

  get hasSummary(): boolean {
    return !!this.summary;
  }

  formatValue(value: number | string | undefined | null): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return typeof value === 'number' ? `${value.toFixed(2)}s` : `${value}`;
  }
}
