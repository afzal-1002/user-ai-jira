import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IntegrationCredential {
  id?: number;
  name: string;
  type: 'GITHUB' | 'JIRA';
  username: string;
  token?: string;
  secretReference?: string;
  maskedSecret?: string;
  maskedToken?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JiraDomain {
  id?: number;
  domainName: string;
  baseUrl: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface JiraProjectConfig {
  id?: number;
  domainId?: number;
  projectKey: string;
  projectName: string;
  projectTypeKey?: string;
  description?: string;
  leadAccountId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectCreateRequest {
  key: string;
  projectName: string;
  projectTypeKey: string;
  description: string;
  leadAccountId: string;
}

export interface ProjectUpdateRequest {
  projectName: string;
  description: string;
  leadAccountId: string;
}

export interface ProjectRepositoryConfig {
  id?: number;
  repositoryId?: number;
  projectKey: string;
  repoName: string;
  repoUrl: string;
  defaultBranch: string;
  credentialId: number;
  primaryRepository: boolean;
  active: boolean;
  // Backward compatibility for existing backend response shapes
  repositoryName?: string;
  repositoryUrl?: string;
  integrationCredentialId?: number;
  primaryRepo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminConfigService {
  constructor(private http: HttpClient) {}

  getJiraDomains(): Observable<JiraDomain[]> {
    return this.http.get<JiraDomain[]>('/api/wut/admin/jira-domains');
  }

  createJiraDomain(payload: JiraDomain): Observable<JiraDomain> {
    return this.http.post<JiraDomain>('/api/wut/admin/jira-domains', payload);
  }

  getJiraProjects(): Observable<JiraProjectConfig[]> {
    return this.http.get<JiraProjectConfig[]>('/api/wut/projects');
  }

  createJiraProject(payload: JiraProjectConfig): Observable<JiraProjectConfig> {
    return this.http.post<JiraProjectConfig>('/api/wut/projects', payload);
  }

  createProjectInJiraAndSaveLocal(payload: ProjectCreateRequest): Observable<JiraProjectConfig> {
    return this.http.post<JiraProjectConfig>('/api/wut/projects/create', payload);
  }

  updateProjectById(id: number, payload: ProjectUpdateRequest): Observable<JiraProjectConfig> {
    return this.http.put<JiraProjectConfig>(`/api/wut/projects/${id}`, payload);
  }

  updateProjectByKey(projectKey: string, payload: ProjectUpdateRequest): Observable<JiraProjectConfig> {
    return this.http.put<JiraProjectConfig>(`/api/wut/projects/by-key/${encodeURIComponent(projectKey)}`, payload);
  }

  deleteProjectByKey(projectKey: string): Observable<void> {
    return this.http.delete<void>(`/api/wut/projects/${encodeURIComponent(projectKey)}`);
  }

  syncAllProjects(): Observable<unknown> {
    return this.http.post('/api/wut/projects/sync/all', {});
  }

  listLocalProjectsByBaseUrl(baseUrl: string): Observable<JiraProjectConfig[]> {
    const encoded = encodeURIComponent(baseUrl);
    return this.http.post<JiraProjectConfig[]>(`/api/wut/projects/list/local?baseUrl=${encoded}`, {});
  }

  getIntegrationCredentials(type?: 'GITHUB' | 'JIRA'): Observable<IntegrationCredential[]> {
    const url = type ? `/api/wut/integration-credentials/me?type=${encodeURIComponent(type)}` : '/api/wut/integration-credentials/me';
    return this.http.get<IntegrationCredential[]>(url);
  }

  createIntegrationCredential(payload: IntegrationCredential): Observable<IntegrationCredential> {
    return this.http.post<IntegrationCredential>('/api/wut/integration-credentials', payload);
  }

  getIntegrationCredentialById(credentialId: number): Observable<IntegrationCredential> {
    return this.http.get<IntegrationCredential>(`/api/wut/integration-credentials/${credentialId}`);
  }

  getResolvedIntegrationCredential(credentialId: number): Observable<IntegrationCredential> {
    return this.http.get<IntegrationCredential>(`/api/wut/integration-credentials/${credentialId}/resolved`);
  }

  updateIntegrationCredential(credentialId: number, payload: IntegrationCredential): Observable<IntegrationCredential> {
    return this.http.put<IntegrationCredential>(`/api/wut/integration-credentials/${credentialId}`, payload);
  }

  deleteIntegrationCredential(credentialId: number): Observable<void> {
    return this.http.delete<void>(`/api/wut/integration-credentials/${credentialId}`);
  }

  getProjectRepositories(projectKey: string): Observable<ProjectRepositoryConfig[]> {
    return this.http.get<ProjectRepositoryConfig[]>(`/api/wut/projects/${encodeURIComponent(projectKey)}/repositories`);
  }

  getDefaultProjectRepository(projectKey: string): Observable<ProjectRepositoryConfig> {
    return this.http.get<ProjectRepositoryConfig>(`/api/wut/projects/${encodeURIComponent(projectKey)}/repositories/default`);
  }

  createProjectRepository(projectKey: string, payload: ProjectRepositoryConfig): Observable<ProjectRepositoryConfig> {
    return this.http.post<ProjectRepositoryConfig>(`/api/wut/projects/${encodeURIComponent(projectKey)}/repositories`, payload);
  }

  updateProjectRepository(projectKey: string, repositoryId: number, payload: ProjectRepositoryConfig): Observable<ProjectRepositoryConfig> {
    return this.http.put<ProjectRepositoryConfig>(`/api/wut/projects/${encodeURIComponent(projectKey)}/repositories/${repositoryId}`, payload);
  }

  deleteProjectRepository(projectKey: string, repositoryId: number): Observable<void> {
    return this.http.delete<void>(`/api/wut/projects/${encodeURIComponent(projectKey)}/repositories/${repositoryId}`);
  }
}
