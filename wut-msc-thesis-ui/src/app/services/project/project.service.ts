import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

export interface ProjectCreationPayload {
  key: string;
  projectName: string;
  projectTypeKey: string;
  projectTemplateKey: string;
  description: string;
  leadAccountId: string;
  assigneeType: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  // Project creation is not exposed by MCP server API.
  createProject(projectData: ProjectCreationPayload): Observable<any> {
    return throwError(() => new Error('Project creation is not supported by MCP server API.'));
  }

  // Compatibility method kept for older callers; uses hostPart-aware MCP listing.
  getProjectsByBaseUrl(baseUrlOrSiteId: string | number): Observable<any[]> {
    const hostPart = String(baseUrlOrSiteId || '').trim();
    if (!hostPart) {
      return throwError(() => new Error('A hostPart value is required for MCP project listing.'));
    }

    const params = new HttpParams().set('hostPart', hostPart);
    return this.http.get<any[]>('/api/wut/mcp/server/sites/projects/jira/by-host-part', { params });
  }

  // Compatibility method kept for older callers; uses site-aware MCP listing.
  getLocalProjectsByBaseUrl(baseUrlOrSiteId: string | number): Observable<any[]> {
    const siteId = Number(baseUrlOrSiteId);
    if (!siteId) {
      return throwError(() => new Error('A numeric siteId is required for MCP project listing.'));
    }
    return this.http.get<any[]>(`/api/wut/mcp/server/sites/${siteId}/projects/local`);
  }

  // Not available without a site context in MCP flow.
  getAllProjects(): Observable<any[]> {
    return throwError(() => new Error('Use site-based MCP project listing instead.'));
  }

  // Get project by key using source=jira by default.
  getProjectByKey(projectKey: string): Observable<any> {
    const params = new HttpParams().set('source', 'jira');
    return this.http.get(`/api/wut/mcp/server/projects/${projectKey}`, { params });
  }

  // MCP project update uses projectId.
  updateProject(projectId: string | number, projectData: ProjectCreationPayload): Observable<any> {
    return this.http.put(`/api/wut/mcp/server/projects/${projectId}`, projectData);
  }

  // Project delete should not be exposed in MCP frontend.
  deleteProject(projectKey: string): Observable<void> {
    return throwError(() => new Error('Project delete is not exposed by MCP server flow.'));
  }
}
