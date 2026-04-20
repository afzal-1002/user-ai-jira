import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AnalyzeRepoBugRequest,
  AnalyzeRepoBugResponse,
  ApplyApprovedFixRequest,
  ApplyFixResult,
  BranchSession,
  FixPreview,
  PreviewFixRequest,
  SendReviewRequest,
  SendReviewResponse,
  StartSessionRequest,
  StartSessionResponse
} from '../../models/interface/ai-session-workflow.interface';

@Injectable({
  providedIn: 'root'
})
export class AiSessionWorkflowService {
  private readonly lastSessionPrefix = 'ai:last-session:';

  constructor(private http: HttpClient) {}

  startSession(request: StartSessionRequest): Observable<StartSessionResponse> {
    return this.http.post<StartSessionResponse>('/api/wut/ai/start-session', request);
  }

  getSession(sessionId: string): Observable<BranchSession> {
    return this.http.get<BranchSession>(`/api/wut/ai/sessions/${sessionId}`);
  }

  analyzeRepoBug(request: AnalyzeRepoBugRequest): Observable<AnalyzeRepoBugResponse> {
    return this.http.post<AnalyzeRepoBugResponse>('/api/wut/ai/analyze-repo-bug', request).pipe(
      catchError((error) => {
        if (Number(error?.status || 0) !== 404) {
          throw error;
        }

        return this.http.post<AnalyzeRepoBugResponse>('/api/wut/ai/analyze-repo', request).pipe(
          catchError((fallbackError) => {
            if (Number(fallbackError?.status || 0) !== 404) {
              throw fallbackError;
            }

            // Final fallback for environments exposing only the generic analyze endpoint.
            return this.http.post<any>('/api/wut/ai/analyze', {
              issueKey: request.issueKey,
              userPrompt: request.userPrompt,
              markdown: true,
              explanation: true
            }).pipe(
              map((raw) => this.normalizeAnalyzeResponse(request, raw))
            );
          })
        );
      })
    );
  }

  private normalizeAnalyzeResponse(request: AnalyzeRepoBugRequest, raw: any): AnalyzeRepoBugResponse {
    const analysisText = String(
      raw?.analysisSummary
      || raw?.generation
      || raw?.analysis
      || raw?.result
      || raw?.message
      || 'Analysis completed.'
    );

    return {
      projectKey: String(raw?.projectKey || request.projectKey),
      issueKey: String(raw?.issueKey || request.issueKey),
      repositoryName: String(raw?.repositoryName || raw?.repoName || ''),
      repositoryUrl: String(raw?.repositoryUrl || ''),
      baseBranch: String(raw?.baseBranch || request.baseBranch),
      candidateFiles: Array.isArray(raw?.candidateFiles) ? raw.candidateFiles : [],
      recommendedFile: String(raw?.recommendedFile || ''),
      impactedCodeSnippet: String(raw?.impactedCodeSnippet || analysisText),
      analysisSummary: analysisText,
      possibleSolutions: Array.isArray(raw?.possibleSolutions) ? raw.possibleSolutions : [],
      suggestedBranchName: String(raw?.suggestedBranchName || '')
    };
  }

  previewFix(request: PreviewFixRequest): Observable<FixPreview> {
    return this.http.post<FixPreview>('/api/wut/ai/preview-fix', request);
  }

  applyApprovedFix(request: ApplyApprovedFixRequest): Observable<ApplyFixResult> {
    return this.http.post<ApplyFixResult>('/api/wut/ai/apply-fix', request);
  }

  sendForReview(request: SendReviewRequest): Observable<SendReviewResponse> {
    return this.http.post<SendReviewResponse>('/api/wut/ai/send-review', request);
  }

  saveLastSessionForIssue(issueKey: string, sessionId: string): void {
    const key = String(issueKey || '').trim().toUpperCase();
    if (!key || !sessionId) {
      return;
    }

    sessionStorage.setItem(`${this.lastSessionPrefix}${key}`, sessionId);
  }

  getLastSessionForIssue(issueKey: string): string {
    const key = String(issueKey || '').trim().toUpperCase();
    if (!key) {
      return '';
    }

    return sessionStorage.getItem(`${this.lastSessionPrefix}${key}`) || '';
  }
}
