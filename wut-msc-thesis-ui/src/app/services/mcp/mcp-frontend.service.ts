import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type McpProjectSource = 'jira' | 'local';

export interface McpAssignedSite {
  id: number;
  siteName: string;
  hostPart?: string;
  baseUrl?: string;
  defaultForUser?: boolean;
}

export interface McpFrontendContext {
  activeConfig?: any;
  sites: McpAssignedSite[];
}

export interface McpIssueAnalysisPayload {
  userPrompt: string;
  markdown: boolean;
  explanation: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class McpFrontendService {
  constructor(private http: HttpClient) {}

  getContext(): Observable<McpFrontendContext> {
    return this.http.get<McpFrontendContext>('/api/wut/mcp/frontend/context');
  }

  getSites(): Observable<McpAssignedSite[]> {
    return this.http.get<McpAssignedSite[]>('/api/wut/mcp/frontend/sites');
  }

  getJiraProjects(siteId: number): Observable<any[]> {
    return this.http.get<any[]>(`/api/wut/mcp/frontend/sites/${siteId}/projects/jira`);
  }

  getLocalProjects(siteId: number): Observable<any[]> {
    return this.http.get<any[]>(`/api/wut/mcp/frontend/sites/${siteId}/projects/local`);
  }

  getProjectDetails(projectKey: string, source: McpProjectSource): Observable<any> {
    const params = new HttpParams().set('source', source);
    return this.http.get<any>(`/api/wut/mcp/frontend/projects/${projectKey}`, { params });
  }

  getProjectIssues(
    siteId: number,
    projectKey: string,
    source: McpProjectSource = 'jira',
    maxResults = 50,
    issueType = 'Bug'
  ): Observable<any> {
    let params = new HttpParams()
      .set('siteId', String(siteId))
      .set('source', source)
      .set('maxResults', String(maxResults))
      .set('issueType', issueType);

    return this.http.get<any>(`/api/wut/mcp/frontend/projects/${projectKey}/issues`, { params });
  }

  getIssueDetails(issueKey: string): Observable<any> {
    return this.http.get<any>(`/api/wut/mcp/frontend/issues/${issueKey}`);
  }

  analyzeIssue(issueKey: string, payload: McpIssueAnalysisPayload): Observable<any> {
    return this.http.post<any>(`/api/wut/mcp/frontend/issues/${issueKey}/analysis`, payload);
  }
}
