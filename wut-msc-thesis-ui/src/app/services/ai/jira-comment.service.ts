import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
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

  updateFullComment(issueKey: string, request: JiraCommentUpdateRequest): Observable<any> {
    return this.createComment(issueKey, request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to create MCP comment:', error);
        return throwError(() => error);
      })
    );
  }

  createComment(issueKey: string, request: JiraCommentUpdateRequest): Observable<any> {
    return this.http.post<any>(`/api/wut/mcp/server/issues/${issueKey}/comments`, request);
  }

  getAIComments(issueKey: string): Observable<any[]> {
    return this.http.get<any>(`/api/wut/mcp/server/issues/${issueKey}/comments`).pipe(
      map((response: any) => {
        const comments = response?.fields?.comment?.comments || response?.comments || [];
        return comments.filter((comment: any) => this.isAiComment(comment));
      })
    );
  }

  updateCommentById(issueKey: string, commentId: string, request: JiraCommentUpdateRequest): Observable<any> {
    return this.http.put<any>(`/api/wut/mcp/server/issues/${issueKey}/comments/${commentId}`, request);
  }

  private isAiComment(comment: any): boolean {
    const text = this.extractText(comment?.body || {});
    return text.toLowerCase().includes('ai analysis') || text.toLowerCase().includes('root cause');
  }

  private extractText(node: any): string {
    if (!node) {
      return '';
    }

    if (typeof node.text === 'string') {
      return node.text;
    }

    if (Array.isArray(node.content)) {
      return node.content.map((child: any) => this.extractText(child)).join(' ');
    }

    return '';
  }
}
