import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ai-research-chart-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-research-chart-card.component.html',
  styleUrls: ['./ai-research-chart-card.component.css']
})
export class AiResearchChartCardComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() caption?: string;
}
