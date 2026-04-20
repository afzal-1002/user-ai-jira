import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiIssueAnalysis } from '../../../../models/interface/ai-response.interface';

@Component({
  selector: 'app-ai-response',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-response.component.html',
  styleUrls: ['./ai-response.component.css']
})
export class AiResponseComponent {
  @Input() analysis: AiIssueAnalysis | null = null;

  get hasDetails(): boolean {
    return !!this.analysis?.details;
  }

  get generationHtml(): string {
    return (this.analysis?.generation || '').replace(/\n/g, '<br/>');
  }
}
