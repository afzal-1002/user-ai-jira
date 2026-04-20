import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import {
  AdminConfigService,
  IntegrationCredential,
  JiraProjectConfig,
  ProjectRepositoryConfig
} from '../../../services/admin/admin-config.service';
import { SiteResponse, SiteService } from '../../../services/site/site.service';

@Component({
  selector: 'app-admin-repositories',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-repositories.component.html',
  styleUrls: ['./admin-repositories.component.css']
})
export class AdminRepositoriesComponent implements OnInit {
  projects: JiraProjectConfig[] = [];
  credentials: IntegrationCredential[] = [];
  mappings: ProjectRepositoryConfig[] = [];
  selectedProjectKey = '';
  editingRepositoryId: number | null = null;
  deletingRepositoryId: number | null = null;
  isLoading = false;
  isSaving = false;
  isLoadingRepositories = false;
  successMessage = '';
  errorMessage = '';
  private projectKeyFromRoute = '';

  form = new FormGroup({
    projectKey: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    repoName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    repoUrl: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    defaultBranch: new FormControl<string>('main', { nonNullable: true, validators: [Validators.required] }),
    credentialId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    primaryRepository: new FormControl<boolean>(false, { nonNullable: true }),
    active: new FormControl<boolean>(true, { nonNullable: true })
  });

  constructor(
    private adminConfigService: AdminConfigService,
    private siteService: SiteService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.projectKeyFromRoute = String(this.route.snapshot.queryParamMap.get('projectKey') || '').trim().toUpperCase();

    this.form.controls.projectKey.valueChanges.subscribe((value) => {
      const cleanKey = this.normalizeProjectKey(value || '');
      if (!cleanKey) {
        this.selectedProjectKey = '';
        this.mappings = [];
        this.errorMessage = '';
        return;
      }

      if (cleanKey === this.selectedProjectKey) {
        return;
      }

      this.selectedProjectKey = cleanKey;
      this.errorMessage = '';
      this.loadRepositories(cleanKey);
    });

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.mappings = [];

    this.siteService.getAllSites().subscribe({
      next: (sites) => {
        const baseUrls = Array.from(
          new Set(
            (sites || [])
              .map((site) => this.resolveBaseUrl(site))
              .filter((url) => !!url)
          )
        );

        if (!baseUrls.length) {
          this.projects = [];
          this.loadCredentialsAndInitialize();
          return;
        }

        const projectRequests = baseUrls.map((baseUrl) =>
          this.adminConfigService.listLocalProjectsByBaseUrl(baseUrl).pipe(
            catchError(() => of([] as JiraProjectConfig[]))
          )
        );

        forkJoin(projectRequests).subscribe({
          next: (projectGroups) => {
            const flattened = (projectGroups || []).flat();
            const uniqueByKey = new Map<string, JiraProjectConfig>();

            flattened.forEach((project: any) => {
              const projectKey = String(project?.projectKey || project?.key || '').trim().toUpperCase();
              if (!projectKey) {
                return;
              }

              uniqueByKey.set(projectKey, {
                id: project?.id,
                domainId: project?.domainId,
                projectKey,
                projectName: String(project?.projectName || project?.name || projectKey)
              });
            });

            this.projects = Array.from(uniqueByKey.values());
            this.loadCredentialsAndInitialize();
          },
          error: () => {
            this.projects = [];
            this.loadCredentialsAndInitialize();
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load sites.';
      }
    });
  }

  private loadCredentialsAndInitialize(): void {
    this.adminConfigService.getIntegrationCredentials('GITHUB').subscribe({
      next: (credentials) => {
        this.credentials = credentials || [];
        const initialProjectKey = (
          this.projectKeyFromRoute
          || this.form.controls.projectKey.value
          || this.projects[0]?.projectKey
          || ''
        );
        const normalizedInitialProjectKey = this.normalizeProjectKey(initialProjectKey);

        if (normalizedInitialProjectKey && this.isValidProjectKey(normalizedInitialProjectKey)) {
          this.form.controls.projectKey.setValue(normalizedInitialProjectKey, { emitEvent: false });
          this.selectedProjectKey = normalizedInitialProjectKey;
          this.loadRepositories(normalizedInitialProjectKey);
        } else {
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Failed to load credentials.';
      }
    });
  }

  loadRepositories(projectKey: string): void {
    const cleanKey = this.normalizeProjectKey(projectKey || '');
    
    if (!cleanKey || !this.isValidProjectKey(cleanKey)) {
      this.mappings = [];
      this.isLoading = false;
      this.errorMessage = 'Invalid project key: ' + cleanKey;
      return;
    }

    this.isLoadingRepositories = true;
    this.adminConfigService.getProjectRepositories(cleanKey).subscribe({
      next: (mappings) => {
        this.mappings = (mappings || []).map((mapping) => this.normalizeRepository(mapping));
        this.isLoading = false;
        this.isLoadingRepositories = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.isLoadingRepositories = false;
        this.errorMessage = error?.error?.message || `Failed to load repositories for ${cleanKey}.`;
      }
    });
  }

  onProjectChange(projectKey: string): void {
    const cleanKey = this.normalizeProjectKey(projectKey || '');
    
    if (!cleanKey) {
      this.selectedProjectKey = '';
      this.form.controls.projectKey.setValue('');
      this.mappings = [];
      this.errorMessage = '';
      return;
    }
    
    this.selectedProjectKey = cleanKey;
    this.form.controls.projectKey.setValue(cleanKey, { emitEvent: false });
    this.errorMessage = '';
    this.loadRepositories(cleanKey);
  }

  save(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const projectKey = this.normalizeProjectKey(this.form.controls.projectKey.value);
    const credentialId = this.form.controls.credentialId.value;

    if (!projectKey || !credentialId) {
      this.errorMessage = 'Project and credential are required.';
      return;
    }

    const repoUrl = this.form.controls.repoUrl.value.trim();
    const normalizedRepoName = this.normalizeOwnerRepo(this.form.controls.repoName.value.trim(), repoUrl);

    if (!normalizedRepoName) {
      this.errorMessage = 'Repository name must be in format owner/repo (for example afzal-1002/atos-ai-user).';
      return;
    }

    const payload: ProjectRepositoryConfig = {
      projectKey,
      repoName: normalizedRepoName,
      repoUrl,
      defaultBranch: this.form.controls.defaultBranch.value.trim(),
      credentialId,
      primaryRepository: this.form.controls.primaryRepository.value,
      active: this.form.controls.active.value
    };

    this.isSaving = true;
    const request$ = this.editingRepositoryId
      ? this.adminConfigService.updateProjectRepository(projectKey, this.editingRepositoryId, payload)
      : this.adminConfigService.createProjectRepository(projectKey, payload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = this.editingRepositoryId
          ? 'Repository mapping updated successfully.'
          : 'Repository mapping saved successfully.';
        this.editingRepositoryId = null;
        this.form.reset({
          projectKey,
          repoName: '',
          repoUrl: '',
          defaultBranch: 'main',
          credentialId: null,
          primaryRepository: false,
          active: true
        });
        this.loadRepositories(projectKey);
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.message || 'Failed to save repository mapping.';
      }
    });
  }

  startEdit(mapping: ProjectRepositoryConfig): void {
    const repositoryId = this.resolveRepositoryId(mapping);
    if (!repositoryId) {
      this.errorMessage = 'Cannot edit repository mapping without repository id.';
      return;
    }

    this.editingRepositoryId = repositoryId;
    this.errorMessage = '';
    this.successMessage = '';
    this.form.reset({
      projectKey: mapping.projectKey,
      repoName: mapping.repoName,
      repoUrl: mapping.repoUrl,
      defaultBranch: mapping.defaultBranch || 'main',
      credentialId: mapping.credentialId,
      primaryRepository: mapping.primaryRepository,
      active: mapping.active
    });
    this.selectedProjectKey = mapping.projectKey;
  }

  cancelEdit(): void {
    const projectKey = this.selectedProjectKey || this.form.controls.projectKey.value;
    this.editingRepositoryId = null;
    this.form.reset({
      projectKey,
      repoName: '',
      repoUrl: '',
      defaultBranch: 'main',
      credentialId: null,
      primaryRepository: false,
      active: true
    });
  }

  deleteMapping(mapping: ProjectRepositoryConfig): void {
    const repositoryId = this.resolveRepositoryId(mapping);
    if (!repositoryId) {
      this.errorMessage = 'Cannot delete repository mapping without repository id.';
      return;
    }

    this.deletingRepositoryId = repositoryId;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminConfigService.deleteProjectRepository(mapping.projectKey, repositoryId).subscribe({
      next: () => {
        this.deletingRepositoryId = null;
        this.successMessage = 'Repository mapping deleted successfully.';
        if (this.editingRepositoryId === repositoryId) {
          this.cancelEdit();
        }
        this.loadRepositories(mapping.projectKey);
      },
      error: (error) => {
        this.deletingRepositoryId = null;
        this.errorMessage = error?.error?.message || 'Failed to delete repository mapping.';
      }
    });
  }

  private normalizeRepository(mapping: ProjectRepositoryConfig): ProjectRepositoryConfig {
    return {
      ...mapping,
      id: mapping.id ?? mapping.repositoryId,
      repositoryId: mapping.repositoryId ?? mapping.id,
      repoName: mapping.repoName || mapping.repositoryName || '',
      repoUrl: mapping.repoUrl || mapping.repositoryUrl || '',
      credentialId: Number(mapping.credentialId ?? mapping.integrationCredentialId ?? 0),
      primaryRepository: Boolean(mapping.primaryRepository ?? mapping.primaryRepo),
      active: mapping.active !== false
    };
  }

  private resolveRepositoryId(mapping: ProjectRepositoryConfig): number | null {
    const id = mapping.id ?? mapping.repositoryId;
    return typeof id === 'number' && id > 0 ? id : null;
  }

  private isValidProjectKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    const trimmed = key.trim();
    // Project keys are alphanumeric, typically uppercase, and non-empty
    return /^[A-Z0-9]+$/.test(trimmed) && trimmed.length > 0;
  }

  private normalizeProjectKey(value: string): string {
    const raw = String(value || '').trim().toUpperCase();
    if (!raw) {
      return '';
    }

    // Angular select may emit internal value strings such as "1: BUG".
    const indexPrefixed = raw.match(/^\d+\s*:\s*(.+)$/);
    const dePrefixed = (indexPrefixed ? indexPrefixed[1] : raw).trim();

    // If a label-like value sneaks in (e.g. "BUG - Bug Time Estimation"), keep only the key.
    const labelLike = dePrefixed.match(/^([A-Z0-9]+)\s*-\s*.+$/);
    return (labelLike ? labelLike[1] : dePrefixed).trim();
  }

  private normalizeOwnerRepo(repoName: string, repoUrl: string): string {
    const direct = String(repoName || '').trim().replace(/^\/+|\/+$/g, '');
    if (/^[^/\s]+\/[^/\s]+$/.test(direct)) {
      return direct;
    }

    const fromUrl = this.extractOwnerRepoFromUrl(repoUrl);
    if (fromUrl) {
      return fromUrl;
    }

    return '';
  }

  private extractOwnerRepoFromUrl(repoUrl: string): string {
    const raw = String(repoUrl || '').trim();
    if (!raw) {
      return '';
    }

    const normalized = raw.replace(/\.git$/i, '').replace(/^git@github\.com:/i, 'https://github.com/');

    const githubMatch = normalized.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/i);
    if (githubMatch) {
      return `${githubMatch[1]}/${githubMatch[2]}`;
    }

    return '';
  }

  private resolveBaseUrl(site: SiteResponse): string {
    const direct = String(site.baseURL || site.baseUrl || '').trim();
    if (direct) {
      return direct;
    }

    const host = String(site.hostPart || '').trim().toLowerCase();
    if (host) {
      return `https://${host}.atlassian.net`;
    }

    return '';
  }

  getProjectLabel(projectKey: string): string {
    const project = this.projects.find((p) => p.projectKey === projectKey);
    return project ? `${project.projectKey} - ${project.projectName}` : projectKey || 'Unknown';
  }

  getCredentialLabel(credentialId: number): string {
    const credential = this.credentials.find((c) => c.id === credentialId);
    return credential ? `${credential.name} (${credential.username})` : 'Unknown';
  }
}
