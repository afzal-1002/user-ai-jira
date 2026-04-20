import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AutoFixRequest {
  projectKey: string;
  issueKey: string;
  branchName?: string;
  userPrompt?: string;
  createPullRequest?: boolean;
  repoName?: string;
  baseBranch?: string;
  credentialId?: number;
  filePath?: string;
  commitMessage?: string;
  pullRequestTitle?: string;
  pullRequestDescription?: string;
}

export interface AutoFixResponse {
  sessionId?: string;
  projectKey: string;
  issueKey: string;
  repositoryName?: string;
  repositoryUrl?: string;
  branchName?: string;
  baseBranch?: string;
  compareUrl?: string;
  pullRequestUrl?: string | null;
  status?: string;
  changedFiles?: string[];
  commitMessage?: string;
  changeSummary?: string;
  userMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AutoFixService {
  constructor(private http: HttpClient) {}

  runAutoFix(request: AutoFixRequest): Observable<AutoFixResponse> {
    return this.http.post<AutoFixResponse>('/api/wut/ai/auto-fix', request);
  }
}
