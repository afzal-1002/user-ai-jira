import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../../services/project/project.service';
import { AuthService } from '../../../services/auth/auth.service';

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
    private projectService: ProjectService,
    private authService: AuthService
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

    // Fallback: load projects from API and find this one
    const user = this.authService.currentUser;
    if (!user || !user.baseUrl) {
      this.isLoading = false;
      this.errorMessage = 'User information not available. Please log in again.';
      return;
    }

    this.projectService.getProjectsByBaseUrl(user.baseUrl).subscribe({
      next: (projects: any[]) => {
        this.isLoading = false;
        if (Array.isArray(projects)) {
          this.project = projects.find(p => p.key === this.projectKey) || null;
        }
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
    this.router.navigate(['/projects']);
  }

  viewBugs(): void {
    if (this.projectKey) {
      this.router.navigate(['/issues', this.projectKey]);
    }
  }
}
