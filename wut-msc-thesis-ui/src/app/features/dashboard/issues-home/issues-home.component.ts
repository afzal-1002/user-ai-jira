import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { McpFrontendService, McpProjectSource } from '../../../services/mcp/mcp-frontend.service';

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
  source: McpProjectSource = 'jira';
  issues: any[] = [];
  isLoading = true;
  errorMessage = '';
  filteredIssues: any[] = [];
  searchQuery = '';
  filterStatus = '';
  filterPriority = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mcpFrontendService: McpFrontendService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: any) => {
      this.projectKey = params['key'] || '';
      this.route.queryParams.subscribe((queryParams) => {
        this.siteId = queryParams['siteId'] ? Number(queryParams['siteId']) : null;
        this.source = queryParams['source'] === 'local' ? 'local' : 'jira';

        if (this.projectKey && this.siteId) {
          this.loadIssues();
        } else {
          this.isLoading = false;
          this.errorMessage = 'Missing site selection. Please select a site and project again.';
        }
      });
    });
  }

  loadIssues(): void {
    if (!this.siteId) {
      this.isLoading = false;
      this.errorMessage = 'Missing site selection.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.mcpFrontendService
      .getProjectIssues(this.siteId, this.projectKey, this.source, 50, 'Bug')
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;
          if (response?.issues && Array.isArray(response.issues)) {
            this.issues = response.issues;
          } else if (Array.isArray(response)) {
            this.issues = response;
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
    this.filteredIssues = this.issues.filter((issue) => {
      const matchesSearch = !this.searchQuery || 
        issue.key?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        issue.fields?.summary?.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      const matchesStatus = !this.filterStatus || 
        issue.fields?.status?.name?.toLowerCase() === this.filterStatus.toLowerCase();
      
      const matchesPriority = !this.filterPriority || 
        issue.fields?.priority?.name?.toLowerCase() === this.filterPriority.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesPriority;
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

  onStatusFilterChange(status: string): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  onPriorityFilterChange(priority: string): void {
    this.filterPriority = priority;
    this.applyFilters();
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

  goBack(): void {
    this.router.navigate(['/projects']);
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

  viewDetails(issue: any): void {
    const issueKey = issue.key;
    this.router.navigate(['/issue-details', issueKey], {
      queryParams: {
        siteId: this.siteId,
        source: this.source,
        projectKey: this.projectKey
      }
    });
  }
}
