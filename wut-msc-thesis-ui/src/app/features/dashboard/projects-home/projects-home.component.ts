import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, SlicePipe, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../services/project/project.service';
import { AuthService } from '../../../services/auth/auth.service';
import { McpAssignedSite, McpFrontendService, McpProjectSource } from '../../../services/mcp/mcp-frontend.service';
import { McpFrontendStateService } from '../../../services/mcp/mcp-frontend-state.service';

@Component({
  selector: 'app-projects-home',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, SlicePipe, NgClass],
  templateUrl: './projects-home.component.html',
  styleUrls: ['./projects-home.component.css']
})
export class ProjectsHomeComponent implements OnInit {
  projects: any[] = [];
  assignedSites: McpAssignedSite[] = [];
  selectedSite: McpAssignedSite | null = null;
  isLoading = true;
  errorMessage = '';
  deleteConfirmationProjectId: string | null = null;
  projectSource: McpProjectSource = 'jira';
  userId: number | string | null = null;

  constructor(
    public router: Router,
    private projectService: ProjectService,
    private authService: AuthService,
    private mcpFrontendService: McpFrontendService,
    private mcpFrontendStateService: McpFrontendStateService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    this.userId = user?.id ?? null;
    this.initializeMcpContext();
  }

  initializeMcpContext(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.mcpFrontendService.getContext().subscribe({
      next: (context) => {
        this.mcpFrontendStateService.setContext(context);
        this.assignedSites = context?.sites || [];
        this.selectedSite = this.mcpFrontendStateService.selectedSite;

        if (!this.selectedSite && this.assignedSites.length) {
          this.selectedSite = this.assignedSites[0];
          this.mcpFrontendStateService.selectSiteById(this.selectedSite.id);
        }

        if (!this.selectedSite) {
          this.isLoading = false;
          this.projects = [];
          this.errorMessage = 'No Jira sites are assigned to your account.';
          return;
        }

        this.loadProjects();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load assigned sites.';
      }
    });
  }

  loadProjects(): void {
    if (!this.selectedSite) {
      this.projects = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const projectCall = this.projectSource === 'jira'
      ? this.mcpFrontendService.getJiraProjects(this.selectedSite.id)
      : this.mcpFrontendService.getLocalProjects(this.selectedSite.id);

    projectCall.subscribe({
      next: (data: any) => {
        this.isLoading = false;
        this.projects = Array.isArray(data) ? data : [data];
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || `Failed to load ${this.projectSource} projects.`;
      }
    });
  }

  toggleProjectSource(source: McpProjectSource): void {
    this.projectSource = source;
    this.mcpFrontendStateService.setSelectedSource(source);
    this.loadProjects();
  }

  onSiteChange(siteIdRaw: string): void {
    const siteId = Number(siteIdRaw);
    if (!siteId) {
      return;
    }

    this.mcpFrontendStateService.selectSiteById(siteId);
    this.selectedSite = this.mcpFrontendStateService.selectedSite;
    this.loadProjects();
  }

  deleteProject(projectKey: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.deleteProject(projectKey).subscribe(
      () => {
        this.isLoading = false;
        console.log('✅ Project deleted:', projectKey);
        this.projects = this.projects.filter(p => p.key !== projectKey);
        this.deleteConfirmationProjectId = null;
      },
      (error) => {
        this.isLoading = false;
        console.error('❌ Failed to delete project:', error);
        this.errorMessage = error.error?.message || 'Failed to delete project. Please try again.';
        this.deleteConfirmationProjectId = null;
      }
    );
  }

  editProject(project: any): void {
    this.router.navigate(['/edit-project', project.key], { state: { project } });
  }

  viewProjectDetails(project: any): void {
    this.router.navigate(['/project-details', project.key], { state: { project } });
  }

  viewBugs(projectKey: string): void {
    if (!this.selectedSite) {
      return;
    }

    this.router.navigate(['/issues', projectKey], {
      queryParams: {
        siteId: this.selectedSite.id,
        source: this.projectSource
      }
    });
  }

  toggleDeleteConfirmation(projectKey: string): void {
    this.deleteConfirmationProjectId = this.deleteConfirmationProjectId === projectKey ? null : projectKey;
  }

  cancelDelete(): void {
    this.deleteConfirmationProjectId = null;
  }
}
