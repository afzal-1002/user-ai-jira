import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { McpFrontendService, McpProjectSource } from '../../../services/mcp/mcp-frontend.service';
import { IssueResponseComponent } from './issue-response/issue-response.component';
import { BugDetailsComponent } from './bug-details/bug-details.component';
import { JiraIssueResponse } from '../../../models/interface/jira-issue.interface';

@Component({
  selector: 'app-issue-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, IssueResponseComponent, BugDetailsComponent],
  templateUrl: './issue-detail.component.html',
  styleUrls: ['./issue-detail.component.css']
})
export class IssueDetailComponent implements OnInit {
  issueKey: string = '';
  siteId: number | null = null;
  source: McpProjectSource = 'jira';
  projectKey: string | null = null;
  issue: JiraIssueResponse | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mcpFrontendService: McpFrontendService
  ) {}

  // Debug: log construction
  // Note: keep constructor lightweight; this log helps trace which component is created
  ngOnChanges?(): void {}

  ngOnInit(): void {
    this.route.params.subscribe((params: any) => {
      this.issueKey = params['issueKey'] || '';
      this.route.queryParams.subscribe((queryParams) => {
        this.siteId = queryParams['siteId'] ? Number(queryParams['siteId']) : null;
        this.source = queryParams['source'] === 'local' ? 'local' : 'jira';
        this.projectKey = queryParams['projectKey'] || null;

        if (this.issueKey) {
          this.loadIssueDetails();
        }
      });
    });
  }

  loadIssueDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.mcpFrontendService.getIssueDetails(this.issueKey).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        this.issue = data;
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || error?.message || 'Failed to load issue details.';
      }
    });
  }

  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('open') || statusLower.includes('to do')) {
      return 'status-open';
    }
    if (statusLower.includes('progress') || statusLower.includes('in progress')) {
      return 'status-progress';
    }
    if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
      return 'status-done';
    }
    return 'status-default';
  }

  getPriorityClass(priority: string): string {
    const priorityLower = priority?.toLowerCase() || '';
    if (priorityLower.includes('high') || priorityLower.includes('critical')) {
      return 'priority-high';
    }
    if (priorityLower.includes('medium')) {
      return 'priority-medium';
    }
    if (priorityLower.includes('low')) {
      return 'priority-low';
    }
    return 'priority-default';
  }

  goBack(): void {
    this.router.navigate(['/issues', this.projectKey || this.issue?.fields?.project?.key || 'BUG'], {
      queryParams: {
        siteId: this.siteId,
        source: this.source
      }
    });
  }
}
