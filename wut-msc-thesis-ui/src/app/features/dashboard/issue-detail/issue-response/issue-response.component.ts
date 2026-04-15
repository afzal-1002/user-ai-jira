import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JiraIssueResponse, Comment, DocumentBody, DocumentNode } from '../../../../models/interface/jira-issue.interface';
import { CommentRendererComponent } from './comment-renderer/comment-renderer.component';
import { IssueService } from '../../../../services/issue/issue.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { JiraCommentService, JiraCommentUpdateRequest } from '../../../../services/ai/jira-comment.service';

@Component({
  selector: 'app-issue-response',
  standalone: true,
  imports: [CommonModule, FormsModule, CommentRendererComponent],
  templateUrl: './issue-response.component.html',
  styleUrls: ['./issue-response.component.css']
})
export class IssueResponseComponent implements OnInit {
  @Input() issue: JiraIssueResponse | null = null;

  displayedComments: Comment[] = [];
  commentPage = 1;
  commentsPerPage = 10;
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

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.baseUrl = user?.baseUrl || null;
      if (this.issue) {
        this.totalComments = this.issue.fields.comment?.total || 0;
        this.loadCommentPage(1);
      }
    });
  }

  loadCommentPage(page: number): void {
    if (!this.issue?.fields.comment?.comments) return;

    this.commentPage = page;
    const startIndex = (page - 1) * this.commentsPerPage;
    const endIndex = startIndex + this.commentsPerPage;
    this.displayedComments = this.issue.fields.comment.comments.slice(startIndex, endIndex);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  getStatusColor(status: string | undefined): string {
    if (!status) return 'secondary';

    const statusMap: { [key: string]: string } = {
      'Open': 'primary',
      'In Progress': 'warning',
      'Done': 'success',
      'Closed': 'success',
      'Resolved': 'success',
      'To Do': 'secondary',
      'In Review': 'info'
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

  get totalCommentPages(): number {
    return Math.ceil(this.totalComments / this.commentsPerPage);
  }

  get visiblePages(): number[] {
    const totalPages = this.totalCommentPages;
    const pages: number[] = [];
    const start = Math.max(1, this.commentPage - 2);
    const end = Math.min(totalPages, this.commentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  deleteComment(comment: Comment): void {
    if (!this.issue || !this.baseUrl || !comment.id) {
      return;
    }

    const issueKey = this.issue.key;

    this.issueService.deleteIssueComment(issueKey, comment.id, this.baseUrl).subscribe({
      next: () => {
        if (!this.issue) return;

        // Remove from full list
        const all = this.issue.fields.comment?.comments || [];
        this.issue.fields.comment.comments = all.filter(c => c.id !== comment.id);
        this.totalComments = this.issue.fields.comment.comments.length;

        // Refresh current page view
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
    if (!this.issue || !this.baseUrl || !comment.id || !this.editedCommentText.trim()) {
      return;
    }

    const issueKey = this.issue.key;

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

        // update local body
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
    if (!this.issue || !this.issue.key || !this.newCommentText.trim()) {
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

    const issueKey = this.issue.key;

    this.addInProgress = true;
    this.addErrorMessage = '';

    this.jiraCommentService.createComment(issueKey, request).subscribe({
      next: () => {
        this.addInProgress = false;
        this.newCommentText = '';

        if (this.baseUrl) {
          this.issueService.getIssueByKey(issueKey, this.baseUrl).subscribe({
            next: (updated: JiraIssueResponse) => {
              this.issue = updated;
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
