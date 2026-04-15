import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  // Create a new project
  createProject(projectData: ProjectCreationPayload): Observable<any> {
    return this.http.post('/api/wut/projects/create', projectData);
  }

  // Get all projects by baseUrl
  getProjectsByBaseUrl(baseUrl: string): Observable<any[]> {
    const params = { baseUrl };
    return this.http.post<any[]>('/api/wut/projects/list/jira', {}, { params });
  }

  // Get local projects by baseUrl
  getLocalProjectsByBaseUrl(baseUrl: string): Observable<any[]> {
    const params = { baseUrl };
    return this.http.post<any[]>('/api/wut/projects/list/local', {}, { params });
  }

  // Get all projects
  getAllProjects(): Observable<any[]> {
    return this.http.get<any[]>('/api/wut/projects');
  }

  // Get project by key
  getProjectByKey(projectKey: string): Observable<any> {
    return this.http.get(`/api/wut/projects/${projectKey}`);
  }

  // Update an existing Jira project by key
  updateProject(projectKey: string, projectData: ProjectCreationPayload): Observable<any> {
    return this.http.put(`/api/wut/projects/jira/${projectKey}`, projectData);
  }

  // Delete project
  deleteProject(projectKey: string): Observable<void> {
    // Use Jira-backed delete endpoint: /api/wut/projects/jira/{projectKey}
    return this.http.delete<void>(`/api/wut/projects/jira/${projectKey}`);
  }
}
