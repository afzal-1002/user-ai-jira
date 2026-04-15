import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { McpFrontendService } from '../../../services/mcp/mcp-frontend.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {
  projectKey = '';
  project: any | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mcpFrontendService: McpFrontendService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectKey = params['key'] || '';
      this.loadProject();
    });
  }

  private loadProject(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // First try to use navigation state (when coming from projects list)
    const state: any = history.state;
    if (state && state.project && state.project.key === this.projectKey) {
      this.project = state.project;
      this.isLoading = false;
      return;
    }

    this.mcpFrontendService.getProjectDetails(this.projectKey, 'jira').subscribe({
      next: (project: any) => {
        this.isLoading = false;
        this.project = project || null;
        if (!this.project) {
          this.errorMessage = `Project with key ${this.projectKey} not found.`;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Failed to load project details', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load project details.';
      }
    });
  }

  goBackToProjects(): void {
    this.router.navigate(['/mcp/projects']);
  }

  viewBugs(): void {
    if (this.projectKey) {
      this.router.navigate(['/mcp/projects', this.projectKey, 'issues']);
    }
  }
}
