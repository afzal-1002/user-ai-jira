import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IssueService {
  constructor(private http: HttpClient) {}

  // Get all issues by project key
  getAllIssuesByProjectKey(projectKey: string, baseUrl: string): Observable<any> {
    const payload = {
      jql: `project = "${projectKey}"`,
      maxResults: 1000,
      startAt: 0,
      fields: ['*all'],
      expand: 'changelog,renderedFields,comments',
      fieldsByKeys: true,
      reconcileIssues: [] as any[]
    };
    
    const params = { baseUrl };
    return this.http.post<any>(
      '/api/jira/issues/search/project/issues',
      payload,
      { params }
    );
  }

  // Get issue by key
  getIssueByKey(issueKey: string, baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.get<any>(
      `/api/jira/issues/${issueKey}`,
      { params }
    );
  }

  // Create an issue
  createIssue(issueData: any, baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.post<any>(
      '/api/jira/issues',
      issueData,
      { params }
    );
  }

  // Update an issue
  updateIssue(issueKey: string, issueData: any, baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.put<any>(
      `/api/jira/issues/${issueKey}`,
      issueData,
      { params }
    );
  }

  // Delete an issue
  deleteIssue(issueKey: string, baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.delete(
      `/api/jira/issues/${issueKey}`,
      { params, responseType: 'text' }
    ) as Observable<string>;
  }

  // Get issue by ID or Key
  getIssueByIdOrKey(issueIdOrKey: string, baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.get<any>(
      `/api/jira/issues/${issueIdOrKey}`,
      { params }
    );
  }

  // Get issue with selected fields
  getIssueWithSelectedFields(issueKey: string, fieldsCsv: string, baseUrl: string): Observable<any> {
    const params = { baseUrl, fields: fieldsCsv };
    return this.http.get<any>(
      `/api/jira/issues/${issueKey}`,
      { params }
    );
  }

  // Bulk fetch issues by ID or key
  bulkFetchIssuesByIdOrKey(issueIdsOrKeys: string[], baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.post<any>(
      '/api/jira/issues/bulk-fetch',
      { issueIdsOrKeys },
      { params }
    );
  }

  // Get Changelog
  getChangelog(issueIdOrKey: string, baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.get<any>(
      `/api/jira/issues/${issueIdOrKey}/changelog`,
      { params }
    );
  }

  // Delete a comment from an issue
  deleteIssueComment(issueKey: string, commentId: string, baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.delete(
      `/api/wut/jira/comment/${issueKey}/${commentId}`,
      { params, responseType: 'text' }
    ) as Observable<string>;
  }

  // Update a Jira comment body
  updateIssueComment(issueKey: string, commentId: string, payload: any, baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.put<any>(
      `/api/wut/jira/comment/${issueKey}/${commentId}`,
      payload,
      { params }
    );
  }

  // Assign issue
  assignIssue(issueIdOrKey: string, accountId: string, baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.put<any>(
      `/api/jira/issues/${issueIdOrKey}/assignee`,
      { accountId },
      { params }
    );
  }

  // Search issues with JQL
  searchIssues(jql: string, baseUrl: string): Observable<any> {
    const payload = {
      jql,
      maxResults: 1000,
      startAt: 0,
      fields: ['*all'],
      expand: 'changelog,renderedFields,comments'
    };
    const params = { baseUrl };
    return this.http.post<any>(
      '/api/jira/issues/search',
      payload,
      { params }
    );
  }
}


