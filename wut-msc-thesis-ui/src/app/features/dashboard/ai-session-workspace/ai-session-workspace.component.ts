import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { McpFrontendService } from '../../../services/mcp/mcp-frontend.service';
import { IssueResponse } from '../../../models/interface/mcp-server.interface';
import {
  AiSessionStatus,
  AnalyzeRepoBugResponse,
  ApplyFixResult,
  BranchSession,
  FixPreview
} from '../../../models/interface/ai-session-workflow.interface';
import { AiSessionWorkflowService } from '../../../services/ai/ai-session-workflow.service';
import { AdminConfigService, ProjectRepositoryConfig } from '../../../services/admin/admin-config.service';

@Component({
  selector: 'app-ai-session-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ai-session-workspace.component.html',
  styleUrls: ['./ai-session-workspace.component.css']
})
export class AiSessionWorkspaceComponent implements OnInit {
  sessionId = '';
  issueKey = '';
  projectKey = '';

  session: BranchSession | null = null;
  issue: IssueResponse | null = null;
  analysis: AnalyzeRepoBugResponse | null = null;
  preview: FixPreview | null = null;
  applyResult: ApplyFixResult | null = null;

  defaultRepoName = '';
  defaultBaseBranch = '';

  prompt = 'Focus on the production path, not tests.';
  commitMessage = '';
  selectedFilePath = '';

  isSessionLoading = true;
  isIssueLoading = false;
  isAnalyzing = false;
  isPreviewLoading = false;
  isApplying = false;
  isSendingReview = false;

  sessionError = '';
  analysisError = '';
  previewError = '';
  applyError = '';
  reviewError = '';

  readonly statusOrder: AiSessionStatus[] = ['CREATED', 'ANALYZED', 'PREVIEW_READY', 'APPLIED', 'REVIEW', 'FAILED'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mcpFrontendService: McpFrontendService,
    private aiSessionWorkflowService: AiSessionWorkflowService,
    private adminConfigService: AdminConfigService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.sessionId = String(params.get('sessionId') || '').trim();
      this.issueKey = String(this.route.snapshot.queryParamMap.get('issueKey') || '').trim().toUpperCase();
      this.projectKey = String(this.route.snapshot.queryParamMap.get('projectKey') || '').trim().toUpperCase();
      this.initializeWorkspace();
    });
  }

  get sessionStatus(): AiSessionStatus | 'UNKNOWN' {
    if (this.session?.status) {
      return this.session.status;
    }

    if (this.projectKey && this.issueKey) {
      return 'CREATED';
    }

    return 'UNKNOWN';
  }

  get sessionStatusLabel(): string {
    if (!this.session && this.projectKey && this.issueKey) {
      return 'READY';
    }

    return this.sessionStatus;
  }

  get hasActiveSession(): boolean {
    return !!this.session && !!this.session.sessionId && this.session.sessionId === this.sessionId;
  }

  get canGeneratePreview(): boolean {
    return !!this.selectedFilePath && !!this.issueKey && !this.isPreviewLoading;
  }

  get canApplyFix(): boolean {
    return !!this.selectedFilePath && !!this.issueKey && !this.isApplying && this.sessionStatus !== 'REVIEW';
  }

  get canSendForReview(): boolean {
    return (this.sessionStatus === 'APPLIED' || this.sessionStatus === 'REVIEW') && !this.isSendingReview;
  }

  get previewButtonText(): string {
    return this.preview ? 'Regenerate Preview' : 'Generate Preview';
  }

  get selectedIssueSummary(): string {
    return this.issue?.fields?.summary || 'No summary available.';
  }

  get repositoryDisplayName(): string {
    return String(
      this.analysis?.repositoryName
      || this.session?.repositoryName
      || this.session?.repoName
      || this.defaultRepoName
      || ''
    ).trim();
  }

  get branchDisplayName(): string {
    return String(
      this.session?.branchName
      || this.analysis?.suggestedBranchName
      || this.defaultBaseBranch
      || ''
    ).trim();
  }

  get possibleSolutions(): string[] {
    if (!this.analysis?.possibleSolutions?.length) {
      return [];
    }

    return this.analysis.possibleSolutions;
  }

  initializeWorkspace(): void {
    if (!this.sessionId) {
      this.isSessionLoading = false;
      this.sessionError = 'Missing session id.';
      return;
    }

    this.isSessionLoading = true;
    this.sessionError = '';
    this.analysisError = '';
    this.previewError = '';
    this.applyError = '';
    this.reviewError = '';

    this.aiSessionWorkflowService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session = session;
        this.issueKey = this.issueKey || this.resolveIssueKeyFromSession(session);
        this.projectKey = this.projectKey || this.resolveProjectKeyFromSession(session);
        this.loadDefaultRepositoryMapping(this.projectKey);
        this.selectedFilePath = this.selectedFilePath || String(session.recommendedFile || '').trim();
        this.commitMessage = this.commitMessage || `AI fix for ${this.issueKey || 'issue'}`;

        this.hydrateAnalysisFromSession(session);
        this.hydratePreviewFromSession(session);

        if (this.issueKey) {
          this.loadIssueDetails(this.issueKey);
          this.aiSessionWorkflowService.saveLastSessionForIssue(this.issueKey, this.sessionId);
        }

        this.isSessionLoading = false;

        if (!this.analysis && (this.sessionStatus === 'CREATED' || this.sessionStatus === 'FAILED')) {
          this.runAnalysis();
        }
      },
      error: (error) => {
        if (Number(error?.status || 0) === 404) {
          this.handleMissingSessionWithoutAutoCreate();
          return;
        }

        this.isSessionLoading = false;
        this.sessionError = this.buildErrorMessage(error, 'Failed to load AI session.');
      }
    });
  }

  private handleMissingSessionWithoutAutoCreate(): void {
    const issueKey = String(this.issueKey || this.route.snapshot.queryParamMap.get('issueKey') || '').trim().toUpperCase();
    const projectKey = String(this.projectKey || this.route.snapshot.queryParamMap.get('projectKey') || '').trim().toUpperCase();

    if (!issueKey || !projectKey) {
      this.isSessionLoading = false;
      this.sessionError = 'Session not found and the page does not have enough context to create a new one. Reopen the issue and start AI analysis again.';
      return;
    }

    // Update stored values
    this.issueKey = issueKey;
    this.projectKey = projectKey;
    this.loadDefaultRepositoryMapping(projectKey);

    // Important: do NOT create a new session/branch when opening workspace.
    // Session/branch creation is deferred until Apply Fix.
    this.session = null;
    this.analysis = null;
    this.preview = null;
    this.applyResult = null;
    this.isSessionLoading = false;
    this.sessionError = '';

    if (issueKey) {
      this.loadIssueDetails(issueKey);
    }
  }

  loadIssueDetails(issueKey: string): void {
    this.isIssueLoading = true;

    this.mcpFrontendService.getIssueWithComments(issueKey).subscribe({
      next: (issue) => {
        this.issue = issue;
        this.isIssueLoading = false;
      },
      error: () => {
        this.isIssueLoading = false;
      }
    });
  }

  runAnalysis(): void {
    if (this.isAnalyzing) {
      return;
    }

    if (!this.projectKey || !this.issueKey) {
      this.analysisError = 'Cannot analyze because project key or issue key is missing.';
      return;
    }

    const baseBranch = String(this.session?.baseBranch || 'main').trim() || 'main';
    const userPrompt = String(this.prompt || '').trim() || 'Focus on the production path, not tests.';

    this.isAnalyzing = true;
    this.analysisError = '';

    this.aiSessionWorkflowService.analyzeRepoBug({
      projectKey: this.projectKey,
      issueKey: this.issueKey,
      baseBranch,
      userPrompt
    }).subscribe({
      next: (analysis) => {
        this.analysis = analysis;
        this.selectedFilePath = this.selectedFilePath || String(analysis.recommendedFile || '').trim();
        this.isAnalyzing = false;
        this.refreshSession();
      },
      error: (error) => {
        this.isAnalyzing = false;
        this.analysisError = this.buildErrorMessage(error, 'Failed to analyze repository for this issue.');
      }
    });
  }

  generatePreview(): void {
    if (!this.canGeneratePreview || !this.selectedFilePath || !this.issueKey) {
      return;
    }

    const userPrompt = String(this.prompt || '').trim() || 'Keep the change minimal and avoid unrelated edits.';

    this.isPreviewLoading = true;
    this.previewError = '';

    this.aiSessionWorkflowService.previewFix({
      sessionId: this.sessionId,
      issueKey: this.issueKey,
      filePath: this.selectedFilePath,
      userPrompt
    }).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.isPreviewLoading = false;
        this.refreshSession();
      },
      error: (error) => {
        this.isPreviewLoading = false;
        this.previewError = this.buildErrorMessage(error, 'Failed to generate fix preview.');
      }
    });
  }

  applyFix(): void {
    if (!this.issueKey || !this.selectedFilePath || this.isApplying) {
      return;
    }

    this.isApplying = true;
    this.applyError = '';

    this.ensureSessionForApply(
      () => {
        const applyWithPreview = () => {
          if (!this.preview?.updatedContent) {
            this.isApplying = false;
            this.applyError = 'Unable to apply fix because preview content is missing.';
            return;
          }

          this.aiSessionWorkflowService.applyApprovedFix({
            sessionId: this.sessionId,
            issueKey: this.issueKey,
            filePath: this.selectedFilePath,
            updatedContent: this.preview.updatedContent,
            commitMessage: String(this.commitMessage || '').trim() || `AI fix for ${this.issueKey}`
          }).subscribe({
            next: (result) => {
              this.applyResult = result;
              this.isApplying = false;
              this.refreshSession();
            },
            error: (error) => {
              this.isApplying = false;
              this.applyError = this.buildErrorMessage(error, 'Failed to apply approved fix.');
            }
          });
        };

        // If preview doesn't exist yet, generate it now in the newly created session,
        // then apply fix in the same action.
        if (!this.preview?.updatedContent) {
          const userPrompt = String(this.prompt || '').trim() || 'Keep the change minimal and avoid unrelated edits.';

          this.aiSessionWorkflowService.previewFix({
            sessionId: this.sessionId,
            issueKey: this.issueKey,
            filePath: this.selectedFilePath,
            userPrompt
          }).subscribe({
            next: (preview) => {
              this.preview = preview;
              applyWithPreview();
            },
            error: (error) => {
              this.isApplying = false;
              this.applyError = this.buildErrorMessage(error, 'Failed to generate preview before applying fix.');
            }
          });
          return;
        }

        applyWithPreview();
      },
      (errorMessage) => {
        this.isApplying = false;
        this.applyError = errorMessage;
      }
    );
  }

  sendForReview(): void {
    if (!this.session || this.isSendingReview) {
      return;
    }

    const issueForTitle = this.issueKey || this.resolveIssueKeyFromSession(this.session);

    this.isSendingReview = true;
    this.reviewError = '';

    this.aiSessionWorkflowService.sendForReview({
      sessionId: this.sessionId,
      baseBranch: this.session.baseBranch || 'main',
      title: `AI review for ${issueForTitle || 'issue'}`,
      description: `Automated AI fix for issue ${issueForTitle || 'N/A'}`
    }).subscribe({
      next: () => {
        this.isSendingReview = false;
        this.router.navigate(['/ai/sessions', this.sessionId, 'review']);
      },
      error: (error) => {
        this.isSendingReview = false;
        this.reviewError = this.buildErrorMessage(error, 'Failed to send for review.');
      }
    });
  }

  goToIssueDetails(): void {
    if (!this.issueKey) {
      return;
    }

    this.router.navigate(['/mcp/issues', this.issueKey], {
      queryParams: {
        projectKey: this.projectKey || undefined
      }
    });
  }

  statusClass(status: AiSessionStatus | 'UNKNOWN'): string {
    return `status-${String(status || 'UNKNOWN').toLowerCase()}`;
  }

  private refreshSession(): void {
    if (!this.sessionId || !this.hasActiveSession) {
      return;
    }

    this.aiSessionWorkflowService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session = session;
        this.issueKey = this.issueKey || this.resolveIssueKeyFromSession(session);
        this.projectKey = this.projectKey || this.resolveProjectKeyFromSession(session);
        this.hydrateAnalysisFromSession(session);
        this.hydratePreviewFromSession(session);
      }
    });
  }

  private hydrateAnalysisFromSession(session: BranchSession): void {
    const raw = session as unknown as Record<string, unknown>;
    const maybeAnalysis = raw['analysis'];
    if (this.looksLikeAnalyzeResponse(maybeAnalysis)) {
      this.analysis = maybeAnalysis;
      this.selectedFilePath = this.selectedFilePath || String(maybeAnalysis.recommendedFile || '').trim();
      return;
    }

    if (!this.analysis && session.analysisSummary && session.recommendedFile) {
      this.analysis = {
        projectKey: this.resolveProjectKeyFromSession(session),
        issueKey: this.resolveIssueKeyFromSession(session),
        repositoryName: String(session.repositoryName || session.repoName || ''),
        repositoryUrl: String(session.repositoryUrl || ''),
        baseBranch: String(session.baseBranch || 'main'),
        candidateFiles: session.candidateFiles || [],
        recommendedFile: String(session.recommendedFile || ''),
        impactedCodeSnippet: String(session.impactedCodeSnippet || ''),
        analysisSummary: String(session.analysisSummary || ''),
        possibleSolutions: session.possibleSolutions || [],
        suggestedBranchName: String(session.branchName || '')
      };
    }
  }

  private hydratePreviewFromSession(session: BranchSession): void {
    const raw = session as unknown as Record<string, unknown>;
    const maybePreview = raw['preview'];
    if (this.looksLikeFixPreview(maybePreview)) {
      this.preview = maybePreview;
    }
  }

  private looksLikeAnalyzeResponse(value: unknown): value is AnalyzeRepoBugResponse {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const data = value as Partial<AnalyzeRepoBugResponse>;
    return !!data.issueKey && !!data.analysisSummary && Array.isArray(data.candidateFiles);
  }

  private looksLikeFixPreview(value: unknown): value is FixPreview {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const data = value as Partial<FixPreview>;
    return !!data.filePath && typeof data.updatedContent === 'string' && typeof data.originalContent === 'string';
  }

  private resolveIssueKeyFromSession(session: BranchSession | null): string {
    if (!session) {
      return '';
    }

    const primary = String(session.issueKey || '').trim().toUpperCase();
    if (primary) {
      return primary;
    }

    const firstBug = Array.isArray(session.bugs) ? String(session.bugs[0] || '').trim().toUpperCase() : '';
    return firstBug;
  }

  private resolveProjectKeyFromSession(session: BranchSession | null): string {
    if (!session) {
      return '';
    }

    return String(session.projectKey || '').trim().toUpperCase();
  }

  private ensureSessionForApply(onReady: () => void, onFailure: (message: string) => void): void {
    if (this.hasActiveSession) {
      onReady();
      return;
    }

    if (!this.issueKey || !this.projectKey) {
      onFailure('Cannot create branch session because project key or issue key is missing.');
      return;
    }

    this.aiSessionWorkflowService.startSession({
      projectKey: this.projectKey,
      baseBranch: String(this.session?.baseBranch || this.defaultBaseBranch || 'main').trim() || 'main',
      bugs: [this.issueKey]
    }).subscribe({
      next: (session) => {
        this.sessionId = session.sessionId;
        this.session = session;
        this.sessionError = '';
        this.aiSessionWorkflowService.saveLastSessionForIssue(this.issueKey, session.sessionId);
        this.hydrateAnalysisFromSession(session);
        this.hydratePreviewFromSession(session);
        onReady();
      },
      error: (error) => {
        onFailure(this.buildErrorMessage(error, 'Failed to create a branch session for applying fix.'));
      }
    });
  }

  private buildErrorMessage(error: any, fallback: string): string {
    const code = Number(error?.status || 0);
    const backendMessage = String(error?.error?.message || error?.message || '').trim();

    if (code === 401) {
      return 'Unauthorized (401). Please sign in again.';
    }

    if (code === 403) {
      return 'Forbidden (403). You do not have permission for this action.';
    }

    if (code === 404) {
      return 'Not found (404). The session or backend route was not found.';
    }

    if (code === 409) {
      return backendMessage || 'Conflict (409). The branch or file changed concurrently. Refresh and retry.';
    }

    if (code >= 500) {
      return backendMessage || 'Server error. Please retry in a moment.';
    }

    return backendMessage || fallback;
  }

  private loadDefaultRepositoryMapping(projectKey: string): void {
    const normalizedProjectKey = String(projectKey || '').trim().toUpperCase();
    if (!normalizedProjectKey) {
      return;
    }

    this.adminConfigService.getDefaultProjectRepository(normalizedProjectKey).subscribe({
      next: (mapping) => {
        this.defaultRepoName = this.getNormalizedRepoNameFromMapping(mapping);
        this.defaultBaseBranch = String(mapping?.defaultBranch || '').trim();
      },
      error: () => {
        // Keep fallback values empty when no default repository mapping exists.
      }
    });
  }

  private getNormalizedRepoNameFromMapping(mapping: ProjectRepositoryConfig | null | undefined): string {
    if (!mapping) {
      return '';
    }

    const repoName = String(mapping.repoName || mapping.repositoryName || '').trim();
    if (repoName) {
      return repoName;
    }

    const rawUrl = String(mapping.repoUrl || mapping.repositoryUrl || '').trim();
    if (!rawUrl) {
      return '';
    }

    const cleanedUrl = rawUrl.replace(/\.git$/i, '').replace(/\/$/, '');
    const match = cleanedUrl.match(/github\.com[:/]([^/]+\/[^/]+)$/i);
    return match?.[1] || '';
  }
}
