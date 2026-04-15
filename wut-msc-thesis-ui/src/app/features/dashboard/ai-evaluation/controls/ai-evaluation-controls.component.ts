import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type EvaluationTab = 'by-issue' | 'comparison' | 'by-model' | 'features' | 'stability';

@Component({
  selector: 'app-ai-evaluation-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-evaluation-controls.component.html',
  styleUrls: ['./ai-evaluation-controls.component.css']
})
export class AiEvaluationControlsComponent {
  @Input() activeTab: EvaluationTab = 'by-issue';
  @Input() isLoading = false;
  @Input() evalIssueKey = '';
  @Output() evalIssueKeyChange = new EventEmitter<string>();
  @Input() evalProvider: string | null = null;
  @Output() evalProviderChange = new EventEmitter<string | null>();
  @Input() stabilityIssueKey = '';
  @Output() stabilityIssueKeyChange = new EventEmitter<string>();
  @Output() runRequested = new EventEmitter<void>();
  @Output() tabChange = new EventEmitter<EvaluationTab>();

  readonly tabDefinitions: Array<{ value: EvaluationTab; label: string }> = [
    { value: 'by-issue', label: 'By Issue' },
    { value: 'comparison', label: 'Model Comparison' },
    { value: 'by-model', label: 'By AI Model' },
    { value: 'features', label: 'Feature Impact' },
    { value: 'stability', label: 'Stability Analysis' }
  ];

  trackIssue(value: string): void {
    this.evalIssueKeyChange.emit(value);
  }

  trackProvider(value: string | null): void {
    this.evalProviderChange.emit(value);
  }

  trackStability(value: string): void {
    this.stabilityIssueKeyChange.emit(value);
  }

  selectTab(tab: EvaluationTab): void {
    this.tabChange.emit(tab);
  }
}
