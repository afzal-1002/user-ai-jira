import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CommentResponse,
  CreateCommentRequest,
  CreateIssueRequest,
  IssueDetails,
  IssueResponse,
  McpGeminiAnalysisResponse,
  McpIssueAnalysisPayload,
  McpProjectIssuesDetailsResponse,
  McpProjectSource,
  McpServerContextResponse,
  SiteResponse,
  UpdateCommentRequest,
  UpdateProjectRequest,
  JiraProjectResponse
} from '../../models/interface/mcp-server.interface';

export type { McpProjectSource };
export type McpAssignedSite = SiteResponse;
export type McpFrontendContext = McpServerContextResponse;

@Injectable({
  providedIn: 'root'
})
export class McpFrontendService {
  constructor(private http: HttpClient) {}

  getContext(): Observable<McpServerContextResponse> {
    return this.http.get<McpServerContextResponse>('/api/wut/mcp/server/context');
  }

  getSites(): Observable<SiteResponse[]> {
    return this.http.get<SiteResponse[]>('/api/wut/mcp/server/sites');
  }

  getJiraProjectsByHostPart(hostPart: string): Observable<JiraProjectResponse[]> {
    const params = new HttpParams().set('hostPart', hostPart);
    return this.http.get<JiraProjectResponse[]>('/api/wut/mcp/jira/projects/jira/by-host-part', { params });
  }

  getLocalProjects(siteId: number): Observable<JiraProjectResponse[]> {
    return this.http.get<JiraProjectResponse[]>(`/api/wut/mcp/server/sites/${siteId}/projects/local`);
  }

  getProjectDetails(projectKey: string, source: McpProjectSource): Observable<JiraProjectResponse> {
    const params = new HttpParams().set('source', source);
    return this.http.get<JiraProjectResponse>(`/api/wut/mcp/server/projects/${projectKey}`, { params });
  }

  updateProject(projectId: number | string, payload: UpdateProjectRequest): Observable<JiraProjectResponse> {
    return this.http.put<JiraProjectResponse>(`/api/wut/mcp/server/projects/${projectId}`, payload);
  }

  getProjectIssues(
    projectKey: string,
    siteId: number,
    source: McpProjectSource = 'jira',
    maxResults = 50,
    issueType?: string
  ): Observable<{ issues: IssueResponse[]; total?: number; [key: string]: unknown } | IssueResponse[]> {
    let params = new HttpParams()
      .set('siteId', String(siteId))
      .set('source', source)
      .set('maxResults', String(maxResults));

    if (issueType) {
      params = params.set('issueType', issueType);
    }

    return this.http.get<{ issues: IssueResponse[]; total?: number; [key: string]: unknown } | IssueResponse[]>(`/api/wut/mcp/server/projects/${projectKey}/issues`, { params });
  }

  getProjectIssuesByHostPart(
    projectKey: string,
    hostPart: string,
    maxResults = 50,
    issueType?: string
  ): Observable<{ issues: IssueResponse[]; total?: number; [key: string]: unknown } | IssueResponse[]> {
    let params = new HttpParams()
      .set('hostPart', hostPart)
      .set('source', 'jira')
      .set('maxResults', String(maxResults));

    if (issueType) {
      params = params.set('issueType', issueType);
    }

    return this.http.get<{ issues: IssueResponse[]; total?: number; [key: string]: unknown } | IssueResponse[]>(
      `/api/wut/mcp/server/projects/${projectKey}/issues`,
      { params }
    );
  }

  getProjectIssuesWithDetails(
    projectKey: string,
    siteId: number,
    source: McpProjectSource = 'jira',
    maxResults = 50,
    issueType = 'Bug'
  ): Observable<McpProjectIssuesDetailsResponse> {
    const params = new HttpParams()
      .set('siteId', String(siteId))
      .set('source', source)
      .set('maxResults', String(maxResults))
      .set('issueType', issueType);

    return this.http.get<McpProjectIssuesDetailsResponse>(`/api/wut/mcp/server/projects/${projectKey}/issues/details`, { params });
  }

  getIssueDetails(issueKey: string, siteId?: number): Observable<IssueDetails> {
    const headers = siteId ? new HttpHeaders({ 'X-Site-Id': String(siteId) }) : undefined;
    return this.http.get<IssueDetails>(`/api/wut/mcp/server/issues/${issueKey}`, { headers });
  }

  getIssueWithComments(issueKey: string, siteId?: number): Observable<IssueResponse> {
    const headers = siteId ? new HttpHeaders({ 'X-Site-Id': String(siteId) }) : undefined;
    return this.http.get<IssueResponse>(`/api/wut/mcp/server/issues/${issueKey}/comments`, { headers });
  }

  createIssue(payload: CreateIssueRequest): Observable<{ id: string; key: string; self: string; [key: string]: unknown }> {
    return this.http.post<{ id: string; key: string; self: string; [key: string]: unknown }>('/api/wut/mcp/server/issues', payload);
  }

  updateIssue(issueKey: string, payload: CreateIssueRequest): Observable<IssueResponse> {
    return this.http.put<IssueResponse>(`/api/wut/mcp/server/issues/${issueKey}`, payload);
  }

  deleteIssue(issueKey: string, deleteSubtasks = false): Observable<string> {
    const params = new HttpParams().set('deleteSubtasks', String(deleteSubtasks));
    return this.http.delete<string>(`/api/wut/mcp/server/issues/${issueKey}`, { params });
  }

  getIssueComment(issueKey: string, commentId: string): Observable<CommentResponse> {
    return this.http.get<CommentResponse>(`/api/wut/mcp/server/issues/${issueKey}/comments/${commentId}`);
  }

  createIssueComment(issueKey: string, payload: CreateCommentRequest): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`/api/wut/mcp/server/issues/${issueKey}/comments`, payload);
  }

  updateIssueComment(issueKey: string, commentId: string, payload: UpdateCommentRequest): Observable<CommentResponse> {
    return this.http.put<CommentResponse>(`/api/wut/mcp/server/issues/${issueKey}/comments/${commentId}`, payload);
  }

  deleteIssueComment(issueKey: string, commentId: string): Observable<string> {
    return this.http.delete<string>(`/api/wut/mcp/server/issues/${issueKey}/comments/${commentId}`);
  }

  analyzeIssue(issueKey: string, payload: McpIssueAnalysisPayload): Observable<McpGeminiAnalysisResponse> {
    return this.http.post<McpGeminiAnalysisResponse>(`/api/wut/mcp/server/issues/${issueKey}/analysis`, payload);
  }
}
