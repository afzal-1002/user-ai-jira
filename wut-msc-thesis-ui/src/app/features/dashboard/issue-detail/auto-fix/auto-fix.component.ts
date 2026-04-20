import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoFixRequest, AutoFixResponse, AutoFixService } from '../../../../services/ai/auto-fix.service';
import { AdminConfigService, ProjectRepositoryConfig } from '../../../../services/admin/admin-config.service';

@Component({
  selector: 'app-auto-fix',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auto-fix.component.html',
  styleUrls: ['./auto-fix.component.css']
})
export class AutoFixComponent implements OnDestroy {
  @Input() issueKey = '';
  @Input() projectKey = '';

  isSubmitting = false;
  showAdvanced = false;
  progressIndex = 0;
  progressTimer: ReturnType<typeof setInterval> | null = null;
  errorMessage = '';
  result: AutoFixResponse | null = null;

  readonly progressSteps = [
    'Reading issue details',
    'Reading repository',
    'Generating fix',
    'Creating branch and commit'
  ];

  form = new FormGroup({
    branchName: new FormControl<string>('', { nonNullable: true }),
    userPrompt: new FormControl<string>('Fix this defect with the smallest safe change.', { nonNullable: true }),
    createPullRequest: new FormControl<boolean>(false, { nonNullable: true }),
    filePath: new FormControl<string>('', { nonNullable: true }),
    baseBranch: new FormControl<string>('', { nonNullable: true }),
    commitMessage: new FormControl<string>('', { nonNullable: true }),
    pullRequestTitle: new FormControl<string>('', { nonNullable: true }),
    pullRequestDescription: new FormControl<string>('', { nonNullable: true }),
    repoName: new FormControl<string>('', { nonNullable: true }),
    credentialId: new FormControl<number | null>(null, { validators: [Validators.min(1)] })
  });

  constructor(
    private autoFixService: AutoFixService,
    private adminConfigService: AdminConfigService
  ) {}

  ngOnDestroy(): void {
    this.stopProgressTimer();
  }

  get currentProgressText(): string {
    return this.progressSteps[this.progressIndex] || this.progressSteps[0];
  }

  get normalizedProjectKey(): string {
    return String(this.projectKey || '').trim().toUpperCase();
  }

  get normalizedIssueKey(): string {
    return String(this.issueKey || '').trim().toUpperCase();
  }

  runAutoFix(): void {
    this.errorMessage = '';
    this.result = null;

    const projectKey = this.normalizedProjectKey;
    const issueKey = this.normalizedIssueKey;

    if (!projectKey || !issueKey) {
      this.errorMessage = 'Project key and issue key are required.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const branchName = this.form.controls.branchName.value.trim() || `ai-fix-${issueKey.toLowerCase()}`;
    const payload: AutoFixRequest = {
      projectKey,
      issueKey,
      branchName,
      userPrompt: this.form.controls.userPrompt.value.trim() || 'Fix this defect with the smallest safe change.',
      createPullRequest: this.form.controls.createPullRequest.value
    };

    const filePath = this.form.controls.filePath.value.trim();
    const baseBranch = this.form.controls.baseBranch.value.trim();
    const commitMessage = this.form.controls.commitMessage.value.trim();
    const pullRequestTitle = this.form.controls.pullRequestTitle.value.trim();
    const pullRequestDescription = this.form.controls.pullRequestDescription.value.trim();
    const repoName = this.form.controls.repoName.value.trim();
    const credentialId = this.form.controls.credentialId.value;

    if (repoName && !this.isOwnerRepo(repoName)) {
      this.errorMessage = 'Repository name must be in format owner/repo (for example afzal-1002/atos-ai-user).';
      return;
    }

    if (filePath) {
      payload.filePath = filePath;
    }
    if (baseBranch) {
      payload.baseBranch = baseBranch;
    }
    if (commitMessage) {
      payload.commitMessage = commitMessage;
    }
    if (pullRequestTitle) {
      payload.pullRequestTitle = pullRequestTitle;
    }
    if (pullRequestDescription) {
      payload.pullRequestDescription = pullRequestDescription;
    }
    if (repoName) {
      payload.repoName = repoName;
    }
    if (credentialId && credentialId > 0) {
      payload.credentialId = credentialId;
    }

    this.isSubmitting = true;
    this.progressIndex = 0;
    this.startProgressTimer();

    // If repoName is not supplied, try to auto-derive a valid owner/repo from default mapping.
    if (!payload.repoName) {
      this.adminConfigService.getDefaultProjectRepository(projectKey).subscribe({
        next: (mapping) => {
          const derivedRepo = this.getNormalizedRepoNameFromMapping(mapping);
          if (derivedRepo) {
            payload.repoName = derivedRepo;
          }
          this.executeAutoFix(payload);
        },
        error: () => {
          // Fallback: still attempt auto-fix without explicit repoName.
          this.executeAutoFix(payload);
        }
      });
      return;
    }

    this.executeAutoFix(payload);
  }

  private executeAutoFix(payload: AutoFixRequest): void {
    this.errorMessage = '';
    this.result = null;

    this.autoFixService.runAutoFix(payload).subscribe({
      next: (response) => {
        this.result = response;
        this.isSubmitting = false;
        this.stopProgressTimer();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.stopProgressTimer();
        this.errorMessage = this.buildAutoFixErrorMessage(error);
      }
    });
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  openUrl(url?: string | null): void {
    if (!url) {
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  copyBranchName(): void {
    const branchName = this.result?.branchName?.trim();
    if (!branchName) {
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(branchName);
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = branchName;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  private startProgressTimer(): void {
    this.stopProgressTimer();
    this.progressTimer = setInterval(() => {
      this.progressIndex = (this.progressIndex + 1) % this.progressSteps.length;
    }, 1200);
  }

  private stopProgressTimer(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private buildAutoFixErrorMessage(error: any): string {
    const status = Number(error?.status || 0);
    const backendMessage = String(error?.error?.message || error?.message || '').trim();
    const rawErrorText = String(error?.error || '').trim();
    const combined = `${backendMessage} ${rawErrorText}`.toLowerCase();

    if (combined.includes('no static resource') || combined.includes('api/wut/ai/auto-fix')) {
      return 'AutoFix endpoint is not available yet. Please restart AI-INTEGRATION and API-GATEWAY, then try again. Frontend is calling /api/wut/ai/auto-fix through proxy.';
    }

    if (status === 404) {
      return 'AutoFix route was not found (404). Verify AI-INTEGRATION is restarted and gateway exposes POST /api/wut/ai/auto-fix.';
    }

    if (status === 401) {
      return 'Your session is unauthorized for AutoFix. Please log in again and retry.';
    }

    if (status === 403) {
      return 'You do not have permission to run AutoFix for this issue.';
    }

    if (combined.includes('repository name must be in format owner/repo')) {
      return 'Repository name must be in format owner/repo (for example afzal-1002/atos-ai-user). Update project repository mapping under Admin > Project Repositories and retry.';
    }

    if (backendMessage) {
      return backendMessage;
    }

    return 'Failed to run auto-fix flow.';
  }

  private isOwnerRepo(value: string): boolean {
    const repo = String(value || '').trim().replace(/^\/+|\/+$/g, '');
    return /^[^/\s]+\/[^/\s]+$/.test(repo);
  }

  private getNormalizedRepoNameFromMapping(mapping: ProjectRepositoryConfig | null | undefined): string {
    if (!mapping) {
      return '';
    }

    const rawName = String(mapping.repoName || mapping.repositoryName || '').trim();
    if (this.isOwnerRepo(rawName)) {
      return rawName;
    }

    const rawUrl = String(mapping.repoUrl || mapping.repositoryUrl || '').trim();
    return this.extractOwnerRepoFromUrl(rawUrl);
  }

  private extractOwnerRepoFromUrl(repoUrl: string): string {
    const raw = String(repoUrl || '').trim();
    if (!raw) {
      return '';
    }

    const normalized = raw.replace(/\.git$/i, '').replace(/^git@github\.com:/i, 'https://github.com/');
    const githubMatch = normalized.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)/i);
    if (!githubMatch) {
      return '';
    }

    const candidate = `${githubMatch[1]}/${githubMatch[2]}`;
    return this.isOwnerRepo(candidate) ? candidate : '';
  }
}
