import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentRendererComponent } from '../issue-response/comment-renderer/comment-renderer.component';
import { JiraIssueResponse, Comment, DocumentBody, DocumentNode } from '../../../../models/interface/jira-issue.interface';
import { IssueService } from '../../../../services/issue/issue.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { JiraCommentService, JiraCommentUpdateRequest } from '../../../../services/ai/jira-comment.service';

@Component({
  selector: 'app-bug-details',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentRendererComponent],
  templateUrl: './bug-details.component.html',
  styleUrls: ['./bug-details.component.css']
})
export class BugDetailsComponent implements OnInit {
  @Input() bug: JiraIssueResponse | null = null;

  commentPage = 1;
  commentsPerPage = 10;
  displayedComments: Comment[] = [];
  totalComments = 0;

  private baseUrl: string | null = null;
  deleteErrorMessage = '';

  editingCommentId: string | null = null;
  editedCommentText = '';
  updateInProgress = false;
  updateErrorMessage = '';

  newCommentText = '';
  addInProgress = false;
  addErrorMessage = '';

  constructor(
    private issueService: IssueService,
    private authService: AuthService,
    private jiraCommentService: JiraCommentService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.baseUrl = user?.baseUrl || null;
      if (this.bug?.fields?.comment) {
        this.totalComments = this.bug.fields.comment.total;
        this.loadCommentPage(1);
      }
    });
  }

  loadCommentPage(page: number) {
    if (!this.bug?.fields?.comment?.comments) return;
    
    this.commentPage = page;
    const startIndex = (page - 1) * this.commentsPerPage;
    const endIndex = startIndex + this.commentsPerPage;
    this.displayedComments = this.bug.fields.comment.comments.slice(startIndex, endIndex);
  }

  get totalCommentPages(): number {
    return Math.ceil(this.totalComments / this.commentsPerPage);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.commentPage - 2);
    const endPage = Math.min(this.totalCommentPages, this.commentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'secondary';
    const statusMap: { [key: string]: string } = {
      'In Progress': 'warning',
      'Todo': 'secondary',
      'Done': 'success',
      'In Review': 'info',
      'Blocked': 'danger'
    };
    return statusMap[status] || 'secondary';
  }

  getPriorityColor(priority: string | undefined): string {
    if (!priority) return 'secondary';
    const priorityMap: { [key: string]: string } = {
      'Highest': 'danger',
      'High': 'danger',
      'Medium': 'warning',
      'Low': 'info',
      'Lowest': 'secondary'
    };
    return priorityMap[priority] || 'secondary';
  }

  getProgressPercent(): number {
    if (!this.bug?.fields?.progress) return 0;
    return this.bug.fields.progress.total > 0 
      ? Math.round((this.bug.fields.progress.progress / this.bug.fields.progress.total) * 100)
      : 0;
  }

  getTimeSpentPercent(): number {
    const timeTracking = this.bug?.fields?.timetracking;
    if (!timeTracking || !timeTracking.originalEstimateSeconds || !timeTracking.remainingEstimateSeconds) return 0;
    return Math.round((timeTracking.originalEstimateSeconds - timeTracking.remainingEstimateSeconds) / timeTracking.originalEstimateSeconds * 100);
  }

  formatTimeEstimate(seconds: number | undefined): string {
    if (seconds === undefined || seconds === null) return '0h';
    const secondsNum = Number(seconds);
    const days = Math.floor(secondsNum / 86400);
    const hours = Math.floor((secondsNum % 86400) / 3600);
    const minutes = Math.floor((secondsNum % 3600) / 60);
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.length > 0 ? parts.join(' ') : '0h';
  }

  getWatchersCount(): number {
    return this.bug?.fields?.watches?.watchCount || 0;
  }

  getVotesCount(): number {
    return this.bug?.fields?.votes?.votes || 0;
  }

  hasAttachments(): boolean {
    return !!this.bug?.fields?.attachment && this.bug.fields.attachment.length > 0;
  }

  getLabels(): string[] {
    return this.bug?.fields?.labels || [];
  }

  getComponentNames(): string[] {
    return this.bug?.fields?.components?.map((c: any) => c.name) || [];
  }

  deleteComment(comment: Comment): void {
    if (!this.bug || !this.baseUrl || !comment.id) {
      return;
    }

    const issueKey = this.bug.key;

    this.issueService.deleteIssueComment(issueKey, comment.id, this.baseUrl).subscribe({
      next: () => {
        if (!this.bug) return;
        const all = this.bug.fields.comment?.comments || [];
        this.bug.fields.comment.comments = all.filter(c => c.id !== comment.id);
        this.totalComments = this.bug.fields.comment.comments.length;
        this.loadCommentPage(this.commentPage);
      },
      error: (err: any) => {
        console.error('Failed to delete comment', err);
        this.deleteErrorMessage = err?.error?.message || err?.message || 'Failed to delete comment.';
      }
    });
  }

  startEditComment(comment: Comment): void {
    if (!comment.id) {
      return;
    }
    this.editingCommentId = comment.id;
    this.editedCommentText = this.extractPlainText(comment.body);
    this.updateErrorMessage = '';
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editedCommentText = '';
    this.updateErrorMessage = '';
  }

  saveEditedComment(comment: Comment): void {
    if (!this.bug || !this.baseUrl || !comment.id || !this.editedCommentText.trim()) {
      return;
    }

    const issueKey = this.bug.key;

    const payload = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: this.editedCommentText.trim()
              }
            ]
          }
        ]
      },
      visibility: comment.visibility
    };

    this.updateInProgress = true;
    this.issueService.updateIssueComment(issueKey, comment.id, payload, this.baseUrl).subscribe({
      next: () => {
        this.updateInProgress = false;
        comment.body = payload.body as DocumentBody;
        this.cancelEdit();
      },
      error: (err: any) => {
        this.updateInProgress = false;
        console.error('Failed to update comment', err);
        this.updateErrorMessage = err?.error?.message || err?.message || 'Failed to update comment.';
      }
    });
  }

  private extractPlainText(body: DocumentBody | undefined): string {
    if (!body?.content) {
      return '';
    }
    const pieces: string[] = [];

    const visit = (nodes: DocumentNode[]) => {
      for (const node of nodes) {
        if (node.text) {
          pieces.push(node.text);
        }
        if (node.content) {
          visit(node.content);
        }
      }
    };

    visit(body.content);
    return pieces.join(' ');
  }

  addComment(): void {
    if (!this.bug || !this.bug.key || !this.newCommentText.trim()) {
      return;
    }

    const text = this.newCommentText.trim();

    const request: JiraCommentUpdateRequest = {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text
              }
            ]
          }
        ]
      }
    };

    const issueKey = this.bug.key;

    this.addInProgress = true;
    this.addErrorMessage = '';

    this.jiraCommentService.createComment(issueKey, request).subscribe({
      next: () => {
        this.addInProgress = false;
        this.newCommentText = '';

        // reload issue to pick up new comment
        if (this.baseUrl) {
          this.issueService.getIssueByKey(issueKey, this.baseUrl).subscribe({
            next: (updated: JiraIssueResponse) => {
              this.bug = updated;
              this.totalComments = updated.fields.comment?.total || updated.fields.comment?.comments?.length || 0;
              this.loadCommentPage(this.commentPage);
            },
            error: (err: any) => {
              console.error('Failed to refresh issue after adding comment', err);
            }
          });
        }
      },
      error: (err: any) => {
        this.addInProgress = false;
        console.error('Failed to add comment', err);
        this.addErrorMessage = err?.error?.message || err?.message || 'Failed to add comment.';
      }
    });
  }
}
