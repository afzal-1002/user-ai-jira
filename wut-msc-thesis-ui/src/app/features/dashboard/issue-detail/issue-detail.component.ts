import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { McpFrontendService, McpProjectSource } from '../../../services/mcp/mcp-frontend.service';
import { McpFrontendStateService } from '../../../services/mcp/mcp-frontend-state.service';
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
    private mcpFrontendService: McpFrontendService,
    private mcpFrontendStateService: McpFrontendStateService
  ) {}

  // Debug: log construction
  // Note: keep constructor lightweight; this log helps trace which component is created
  ngOnChanges?(): void {}

  ngOnInit(): void {
    this.route.params.subscribe((params: any) => {
      this.issueKey = params['issueKey'] || '';
      if (this.issueKey) {
        this.mcpFrontendStateService.setSelectedIssueKey(this.issueKey);
      }
      this.route.queryParams.subscribe((queryParams) => {
        this.siteId = queryParams['siteId'] ? Number(queryParams['siteId']) : this.mcpFrontendStateService.selectedSiteId;
        this.source = queryParams['source'] === 'local' ? 'local' : 'jira';
        this.projectKey = queryParams['projectKey'] || this.mcpFrontendStateService.selectedProjectKey || null;

        if (this.projectKey) {
          this.mcpFrontendStateService.setSelectedProjectKey(this.projectKey);
        }

        if (this.siteId) {
          this.mcpFrontendStateService.selectSiteById(this.siteId);
        }

        if (this.issueKey) {
          this.loadIssueDetails();
        }
      });
    });
  }

  loadIssueDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.mcpFrontendService.getIssueWithComments(this.issueKey, this.siteId || undefined).subscribe({
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

  get resolvedProjectKey(): string {
    const fromIssue = String(this.issue?.fields?.project?.key || '').trim().toUpperCase();
    const fromRoute = String(this.projectKey || '').trim().toUpperCase();
    return fromIssue || fromRoute;
  }

  goBack(): void {
    const savedProjectKey = this.projectKey || this.issue?.fields?.project?.key || this.mcpFrontendStateService.selectedProjectKey || 'BUG';
    const resolvedHostPart = this.mcpFrontendStateService.selectedHostPart || undefined;

    this.mcpFrontendStateService.setSelectedProjectKey(savedProjectKey);

    this.router.navigate(['/mcp/projects', savedProjectKey, 'issues'], {
      queryParams: {
        siteId: this.siteId,
        hostPart: resolvedHostPart,
        source: this.source
      }
    });
  }

  openCopilotWorkspace(): void {
    if (!this.issueKey) {
      return;
    }
    
    // Create a temporary session ID (or you can get it from backend API)
    const sessionId = `session-${Date.now()}`;
    
    this.router.navigate(['/mcp/issues', this.issueKey, 'copilot', sessionId], {
      queryParams: {
        issueKey: this.issueKey,
        projectKey: this.resolvedProjectKey,
        siteId: this.siteId,
        source: this.source
      }
    });
  }
}

