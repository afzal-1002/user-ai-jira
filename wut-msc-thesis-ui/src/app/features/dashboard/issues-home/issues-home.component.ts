import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { McpFrontendService, McpProjectSource } from '../../../services/mcp/mcp-frontend.service';
import { McpFrontendStateService } from '../../../services/mcp/mcp-frontend-state.service';
import { IssueResponse } from '../../../models/interface/mcp-server.interface';

@Component({
  selector: 'app-issues-home',
  standalone: true,
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './issues-home.component.html',
  styleUrls: ['./issues-home.component.css']
})
export class IssuesHomeComponent implements OnInit {
  projectKey: string = '';
  siteId: number | null = null;
  hostPart = '';
  source: McpProjectSource = 'jira';
  issues: IssueResponse[] = [];
  isLoading = true;
  errorMessage = '';
  filteredIssues: IssueResponse[] = [];
  searchQuery = '';
  filterPriority = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mcpFrontendService: McpFrontendService,
    private mcpFrontendStateService: McpFrontendStateService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: any) => {
      this.projectKey = params['key'] || '';
      if (this.projectKey) {
        this.mcpFrontendStateService.setSelectedProjectKey(this.projectKey);
      }
      this.route.queryParams.subscribe((queryParams) => {
        this.siteId = queryParams['siteId'] ? Number(queryParams['siteId']) : this.mcpFrontendStateService.selectedSiteId;
        this.hostPart = String(queryParams['hostPart'] || '').trim() || String(this.mcpFrontendStateService.selectedHostPart || '').trim();
        this.source = queryParams['source'] === 'local' ? 'local' : 'jira';
        const routeProjectKey = String(queryParams['projectKey'] || '').trim();
        if (routeProjectKey) {
          this.projectKey = routeProjectKey;
          this.mcpFrontendStateService.setSelectedProjectKey(routeProjectKey);
        } else if (!this.projectKey) {
          this.projectKey = this.mcpFrontendStateService.selectedProjectKey;
        }

        if (this.siteId) {
          this.mcpFrontendStateService.selectSiteById(this.siteId);
        }

        const canLoadJira = this.source === 'jira' && !!this.hostPart;
        const canLoadLocal = this.source === 'local' && !!this.siteId;

        if (this.projectKey && (canLoadJira || canLoadLocal)) {
          this.loadIssues();
        } else {
          this.isLoading = false;
          this.errorMessage = this.source === 'jira'
            ? 'Missing hostPart selection. Please select a site and project again.'
            : 'Missing site selection. Please select a site and project again.';
        }
      });
    });
  }

  loadIssues(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const selectedSite = this.mcpFrontendStateService.selectedSite;
    const resolvedHostPart = this.hostPart
      || String(selectedSite?.hostPart || '').trim()
      || String(this.mcpFrontendStateService.selectedHostPart || '').trim();

    if (this.source === 'jira' && !resolvedHostPart) {
      this.isLoading = false;
      this.errorMessage = 'Missing hostPart selection.';
      return;
    }

    if (this.source === 'local' && !this.siteId) {
      this.isLoading = false;
      this.errorMessage = 'Missing site selection.';
      return;
    }

    const issuesCall = this.source === 'jira' && resolvedHostPart
      ? this.mcpFrontendService.getProjectIssuesByHostPart(this.projectKey, resolvedHostPart, 50)
      : this.mcpFrontendService.getProjectIssues(this.projectKey, this.siteId as number, this.source, 50);

    issuesCall.subscribe({
        next: (response: { issues: IssueResponse[]; total?: number; [key: string]: unknown } | IssueResponse[]) => {
          this.isLoading = false;
          if (Array.isArray(response)) {
            this.issues = response;
          } else if (Array.isArray(response.issues)) {
            this.issues = response.issues;
          } else {
            this.issues = [];
          }
          this.applyFilters();
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error?.error?.message || error?.message || 'Failed to load issues.';
        }
      });
  }

  applyFilters(): void {
    this.filteredIssues = this.issues.filter((issue: IssueResponse) => {
      const searchLower = this.searchQuery.toLowerCase();
      const matchesSearch = !searchLower || [
        issue.key,
        issue.fields?.summary,
        issue.fields?.description ? this.getDescription(issue.fields.description) : '',
        issue.fields?.statusResponse?.name,
        issue.fields?.status?.name,
        issue.fields?.priorityResponse?.name,
        issue.fields?.priority?.name,
        issue.fields?.assignee?.displayName,
        issue.fields?.reporter?.displayName,
        issue.fields?.issuetype?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchLower));
      
      const matchesPriority = !this.filterPriority || 
        (issue.fields?.priorityResponse?.name?.toLowerCase() === this.filterPriority.toLowerCase() ||
          issue.fields?.priority?.name?.toLowerCase() === this.filterPriority.toLowerCase());
      
      return matchesSearch && matchesPriority;
    }).sort((a, b) => {
      // Extract issue numbers from keys (e.g., "BUG-9" -> 9)
      const numA = parseInt(a.key?.split('-')[1] || '0', 10);
      const numB = parseInt(b.key?.split('-')[1] || '0', 10);
      return numA - numB; // Ascending order
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  onPriorityFilterChange(priority: string): void {
    this.filterPriority = priority;
    this.applyFilters();
  }

  getPriorityClass(priority: string | undefined): string {
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

  getStatusClass(status: string | undefined): string {
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

  goBack(): void {
    this.router.navigate(['/mcp/projects']);
  }

  getDescription(description: any): string {
    if (!description) {
      return 'No description provided';
    }
    
    // If it's a string, return it
    if (typeof description === 'string') {
      return description;
    }
    
    // If it's an object with content property (common in Jira rich text)
    if (typeof description === 'object' && description.content) {
      // Try to extract text from content array
      if (Array.isArray(description.content)) {
        return description.content
          .map((item: any) => {
            if (item.content && Array.isArray(item.content)) {
              return item.content.map((c: any) => c.text || '').join('');
            }
            return item.text || '';
          })
          .join(' ')
          .trim() || 'No description provided';
      }
    }
    
    return 'No description provided';
  }

  viewDetails(issue: IssueResponse): void {
    const issueKey = issue.key;
    const selectedSite = this.mcpFrontendStateService.selectedSite;
    const resolvedHostPart = this.hostPart
      || String(selectedSite?.hostPart || '').trim()
      || String(this.mcpFrontendStateService.selectedHostPart || '').trim();

    this.router.navigate(['/mcp/issues', issueKey], {
      queryParams: {
        siteId: this.siteId,
        hostPart: resolvedHostPart || undefined,
        source: this.source,
        projectKey: this.projectKey || this.mcpFrontendStateService.selectedProjectKey || undefined
      }
    });
  }
}
