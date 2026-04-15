import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueService } from '../../../services/issue/issue.service';

@Component({
  selector: 'app-create-issue-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-issue-modal.component.html',
  styleUrls: ['./create-issue-modal.component.css']
})
export class CreateIssueModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() projectKey: string = '';
  @Input() baseUrl: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() issueCreated = new EventEmitter<any>();

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Form fields
  summary: string = '';
  description: string = '';
  duedate: string = '';
  issuetype: string = 'Bug';
  assigneeUsername: string = '';
  labels: string = '';

  issueTypes = [
    { id: '10000', name: 'Bug' },
    { id: '10001', name: 'Task' },
    { id: '10002', name: 'Story' },
    { id: '10003', name: 'Sub-task' }
  ];

  constructor(private issueService: IssueService) {}

  ngOnInit(): void {}

  closeModal(): void {
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.summary = '';
    this.description = '';
    this.duedate = '';
    this.issuetype = 'Bug';
    this.assigneeUsername = '';
    this.labels = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  createIssue(): void {
    // Validate required fields
    if (!this.summary.trim()) {
      this.errorMessage = 'Summary is required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Build the issue payload
    const issuePayload = {
      fields: {
        project: { key: this.projectKey },
        issuetype: { name: this.issuetype },
        summary: this.summary.trim()
      } as any
    };

    // Add optional fields
    if (this.duedate) {
      issuePayload.fields.duedate = this.duedate;
    }

    if (this.assigneeUsername) {
      issuePayload.fields.assignee = { emailAddress: this.assigneeUsername.trim() };
    }

    // Handle description - support both plain text and rich text format
    if (this.description.trim()) {
      issuePayload.fields.description = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: this.description.trim() }
            ]
          }
        ]
      };
    }

    if (this.labels) {
      issuePayload.fields.labels = this.labels.split(',').map(l => l.trim()).filter(l => l);
    }

    // Call the service to create the issue
    if (this.baseUrl) {
      this.issueService.createIssue(issuePayload, this.baseUrl).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          this.successMessage = `Issue ${response.key} created successfully!`;
          console.log('✅ Issue created:', response);
          
          // Emit the created issue and close after 2 seconds
          setTimeout(() => {
            this.issueCreated.emit(response);
            this.closeModal();
          }, 1500);
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('❌ Failed to create issue:', error);
          this.errorMessage = error?.error?.message || error?.message || 'Failed to create issue. Please try again.';
        }
      });
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }
}
