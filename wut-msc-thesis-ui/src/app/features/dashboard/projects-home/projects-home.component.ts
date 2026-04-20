import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, SlicePipe, NgClass } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { McpAssignedSite, McpFrontendService, McpProjectSource } from '../../../services/mcp/mcp-frontend.service';
import { McpFrontendStateService } from '../../../services/mcp/mcp-frontend-state.service';
import { JiraProjectResponse } from '../../../models/interface/mcp-server.interface';
import { SiteService } from '../../../services/site/site.service';

@Component({
  selector: 'app-projects-home',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, SlicePipe, NgClass],
  templateUrl: './projects-home.component.html',
  styleUrls: ['./projects-home.component.css']
})
export class ProjectsHomeComponent implements OnInit {
  projects: JiraProjectResponse[] = [];
  assignedSites: McpAssignedSite[] = [];
  selectedSite: McpAssignedSite | null = null;
  hasSelectedSite = false;
  isLoading = true;
  errorMessage = '';
  currentUserLabel = '';
  projectSource: McpProjectSource = 'jira';
  userId: number | string | null = null;
  isBugsFlow = false;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private mcpFrontendService: McpFrontendService,
    private mcpFrontendStateService: McpFrontendStateService,
    private siteService: SiteService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    this.userId = user?.id ?? null;
    this.currentUserLabel = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.userName || 'Current User';
    
    // Check if this is the bugs flow
    this.isBugsFlow = this.router.url.includes('/mcp/bugs');
    
    this.initializeMcpContext();
  }

  initializeMcpContext(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.projects = [];
    this.hasSelectedSite = false;

    this.mcpFrontendService.getContext().subscribe({
      next: (context) => {
        this.mcpFrontendStateService.setContext(context);
        this.assignedSites = context?.sites || [];
        this.selectedSite = this.mcpFrontendStateService.selectedSite;

        if (!this.assignedSites.length) {
          this.isLoading = false;
          this.errorMessage = 'No Jira sites are assigned to your account.';
          return;
        }

        if (!this.selectedSite) {
          const persistedSiteId = this.mcpFrontendStateService.selectedSiteId;
          if (persistedSiteId) {
            this.selectedSite = this.assignedSites.find((site) => site.id === persistedSiteId) || null;
            if (this.selectedSite) {
              this.mcpFrontendStateService.selectSiteById(this.selectedSite.id);
            }
          }
        }

        if (this.selectedSite) {
          this.hasSelectedSite = true;
          this.isLoading = false;
          if (this.isBugsFlow) {
            this.goToBugs();
          } else {
            this.loadProjects();
          }
          return;
        }

        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load assigned sites.';
      }
    });
  }

  loadProjects(): void {
    if (this.isBugsFlow) {
      this.projects = [];
      this.isLoading = false;
      return;
    }
    
    if (!this.selectedSite) {
      this.projects = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const hostPart = (this.selectedSite.hostPart || '').trim();
    if (this.projectSource === 'jira' && !hostPart) {
      this.isLoading = false;
      this.projects = [];
      this.errorMessage = 'Selected site is missing hostPart. Please reselect a valid site.';
      return;
    }

    const projectCall = this.projectSource === 'jira'
      ? this.mcpFrontendService.getJiraProjectsByHostPart(hostPart)
      : this.mcpFrontendService.getLocalProjects(this.selectedSite.id);

    projectCall.subscribe({
      next: (data: JiraProjectResponse[] | JiraProjectResponse) => {
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
    if (this.hasSelectedSite) {
      this.loadProjects();
    }
  }

  onSiteChange(siteIdRaw: string): void {
    const siteId = Number(siteIdRaw);
    if (!siteId) {
      this.hasSelectedSite = false;
      this.selectedSite = null;
      this.projects = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.mcpFrontendStateService.selectSiteById(siteId);
    this.selectedSite = this.mcpFrontendStateService.selectedSite;

    this.siteService.getSiteById(siteId).subscribe({
      next: (siteDetails) => {
        this.assignedSites = this.assignedSites.map((site) =>
          site.id === siteId ? ({ ...site, ...siteDetails }) : site
        );

        this.mcpFrontendStateService.setSites(this.assignedSites);
        this.selectedSite = this.mcpFrontendStateService.selectedSite;
        this.hasSelectedSite = true;
        
        if (this.isBugsFlow) {
          this.goToBugs();
        } else {
          this.loadProjects();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.hasSelectedSite = false;
        this.projects = [];
        this.errorMessage = error?.error?.message || 'Failed to resolve selected site details.';
      }
    });
  }

  editProject(project: JiraProjectResponse): void {
    this.router.navigate(['/edit-project', project.key], { state: { project } });
  }

  viewProjectDetails(project: JiraProjectResponse): void {
    this.router.navigate(['/project-details', project.key], { state: { project } });
  }

  viewBugs(projectKey: string): void {
    if (!this.selectedSite) {
      return;
    }

    this.mcpFrontendStateService.setSelectedProjectKey(projectKey);

    this.router.navigate(['/mcp/projects', projectKey, 'issues'], {
      queryParams: {
        projectKey,
        hostPart: this.selectedSite.hostPart || undefined,
        source: this.projectSource
      }
    });
  }

  goToBugs(): void {
    if (!this.selectedSite) {
      return;
    }

    const hostPart = (this.selectedSite.hostPart || '').trim();
    if (!hostPart) {
      this.errorMessage = 'Selected site is missing hostPart. Please reselect a valid site.';
      return;
    }

    // Redirect to issues page to show all bugs/issues for this site
    this.router.navigate(['/mcp/projects', 'all', 'issues'], {
      queryParams: {
        hostPart: hostPart,
        source: 'jira',
        showAllIssues: 'true'
      }
    });
  }

}
