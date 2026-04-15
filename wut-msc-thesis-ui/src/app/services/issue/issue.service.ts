import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  constructor(private http: HttpClient) {}

  // Compatibility method kept for existing components; baseUrl is ignored in MCP mode.
  getIssueByKey(issueKey: string, _baseUrl?: string): Observable<any> {
    return this.http.get<any>(`/api/wut/mcp/server/issues/${issueKey}/comments`);
  }

  // Compatibility method kept for existing components; baseUrl is ignored in MCP mode.
  createIssue(issueData: any, _baseUrl?: string): Observable<any> {
    return this.http.post<any>('/api/wut/mcp/server/issues', issueData);
  }

  // Compatibility method kept for existing components; baseUrl is ignored in MCP mode.
  updateIssue(issueKey: string, issueData: any, _baseUrl?: string): Observable<any> {
    return this.http.put<any>(`/api/wut/mcp/server/issues/${issueKey}`, issueData);
  }

  // Compatibility method kept for existing components; baseUrl is ignored in MCP mode.
  deleteIssue(issueKey: string, _baseUrl?: string, deleteSubtasks = false): Observable<any> {
    const params = new HttpParams().set('deleteSubtasks', String(deleteSubtasks));
    return this.http.delete<any>(`/api/wut/mcp/server/issues/${issueKey}`, { params });
  }

  // Compatibility method kept for existing components; baseUrl is ignored in MCP mode.
  deleteIssueComment(issueKey: string, commentId: string, _baseUrl?: string): Observable<any> {
    return this.http.delete<any>(`/api/wut/mcp/server/issues/${issueKey}/comments/${commentId}`);
  }

  // Compatibility method kept for existing components; baseUrl is ignored in MCP mode.
  updateIssueComment(issueKey: string, commentId: string, payload: any, _baseUrl?: string): Observable<any> {
    return this.http.put<any>(`/api/wut/mcp/server/issues/${issueKey}/comments/${commentId}`, payload);
  }
}
