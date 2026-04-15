import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface JiraCommentVisibility {
  type: string;
  value: string;
}

export interface JiraCommentBodyContentNode {
  type: string;
  text?: string;
  content?: JiraCommentBodyContentNode[];
  attrs?: any;
}

export interface JiraCommentUpdateRequest {
  body: {
    type: 'doc';
    version: number;
    content: JiraCommentBodyContentNode[];
  };
  visibility?: JiraCommentVisibility;
  public?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class JiraCommentService {
  constructor(private http: HttpClient) {}

  /**
   * Update or create a Jira comment
   * POST is used for both create and update operations
   */
  updateFullComment(issueKey: string, request: JiraCommentUpdateRequest): Observable<any> {
    return this.http.post<any>(`/api/wut/jira/comment/${issueKey}`, request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to update/create Jira comment:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new Jira comment
   */
  createComment(issueKey: string, request: JiraCommentUpdateRequest): Observable<any> {
    return this.http.post<any>(`/api/wut/jira/comment/${issueKey}`, request);
  }

  /**
   * Fetch existing AI comments for an issue
   * This helps check if an AI comment already exists
   */
  getAIComments(issueKey: string): Observable<any> {
    return this.http.get<any>(`/api/wut/jira/comment/${issueKey}/ai-comments`);
  }

  /**
   * Update an existing comment by ID
   * NOTE: This requires backend implementation of PUT endpoint
   */
  updateCommentById(issueKey: string, commentId: string, request: JiraCommentUpdateRequest): Observable<any> {
    return this.http.put<any>(`/api/wut/jira/comment/${issueKey}/${commentId}`, request);
  }
}
