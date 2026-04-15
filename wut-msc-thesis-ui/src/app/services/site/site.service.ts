import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SiteCreatePayload {
  siteName: string;
  hostPart: string;
  username: string;
  jiraToken: string;
}

export interface SiteAssignPayload {
  userId: number;
  defaultForUser: boolean;
}

export interface SiteResponse {
  id: number;
  siteName: string;
  hostPart?: string;
  baseURL?: string;
  baseUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  defaultForUser?: boolean;
  projects?: any[];
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class SiteService {
  constructor(private http: HttpClient) {}

  /**
   * Get all saved sites (admin only)
   * GET /api/wut/sites
   */
  getAllSites(): Observable<SiteResponse[]> {
    return this.http.get<SiteResponse[]>('/api/wut/sites');
  }

  /**
   * Get sites assigned to a specific user (admin only)
   * GET /api/wut/sites/by-username?username=...
   */
  getSitesByUsername(username: string): Observable<SiteResponse[]> {
    const params = new HttpParams().set('username', username);
    return this.http.get<SiteResponse[]>('/api/wut/sites/by-username', { params });
  }

  /**
   * Get site by host part (admin only)
   * GET /api/wut/sites/by-host-part?hostPart=...
   */
  getSiteByHostPart(hostPart: string): Observable<SiteResponse> {
    const params = new HttpParams().set('hostPart', hostPart);
    return this.http.get<SiteResponse>('/api/wut/sites/by-host-part', { params });
  }

  /**
   * Get current logged-in user's sites
   * GET /api/wut/sites/current-user
   */
  getCurrentUserSites(): Observable<SiteResponse[]> {
    return this.http.get<SiteResponse[]>('/api/wut/sites/current-user');
  }

  /**
   * Get site by ID (admin only)
   * GET /api/wut/sites/{siteId}
   */
  getSiteById(siteId: number): Observable<SiteResponse> {
    return this.http.get<SiteResponse>(`/api/wut/sites/${siteId}`);
  }

  /**
    * Get site by URL
   * GET /api/wut/sites/by-url?baseURL=https://...
   */
  getSiteByUrl(baseURL: string): Observable<SiteResponse> {
    const params = new HttpParams().set('baseURL', baseURL);
    return this.http.get<SiteResponse>('/api/wut/sites/by-url', { params });
  }

  /**
    * Get site by name
   * GET /api/wut/sites/by-name?siteName=...
   */
  getSiteByName(siteName: string): Observable<SiteResponse> {
    const params = new HttpParams().set('siteName', siteName);
    return this.http.get<SiteResponse>('/api/wut/sites/by-name', { params });
  }

  /**
   * Create a new site (admin only)
   * POST /api/wut/sites
   */
  createSite(payload: SiteCreatePayload): Observable<SiteResponse> {
    return this.http.post<SiteResponse>('/api/wut/sites', payload);
  }

  /**
   * Assign site to user (admin only)
   * POST /api/wut/sites/{siteId}/assign
   */
  assignSiteToUser(siteId: number, payload: SiteAssignPayload): Observable<SiteResponse> {
    return this.http.post<SiteResponse>(`/api/wut/sites/${siteId}/assign`, payload);
  }

  /**
   * Update site name (admin only)
   * PUT /api/wut/sites/{siteId}/name?newSiteName=...
   */
  updateSiteName(siteId: number, newSiteName: string): Observable<SiteResponse> {
    const params = new HttpParams().set('newSiteName', newSiteName);
    return this.http.put<SiteResponse>(`/api/wut/sites/${siteId}/name`, {}, { params });
  }

  /**
   * Update site URL (admin only)
   * PUT /api/wut/sites/{siteId}/url?newBaseURL=...
   */
  updateSiteUrl(siteId: number, newBaseURL: string): Observable<SiteResponse> {
    const params = new HttpParams().set('newBaseURL', newBaseURL);
    return this.http.put<SiteResponse>(`/api/wut/sites/${siteId}/url`, {}, { params });
  }

  /**
   * Delete site (admin only)
   * DELETE /api/wut/sites/{siteId}
   */
  deleteSite(siteId: number): Observable<void> {
    return this.http.delete<void>(`/api/wut/sites/${siteId}`);
  }

  /**
   * Delete site by name (admin only)
   * DELETE /api/wut/sites/by-name?siteName=...
   */
  deleteSiteByName(siteName: string): Observable<void> {
    const params = new HttpParams().set('siteName', siteName);
    return this.http.delete<void>('/api/wut/sites/by-name', { params });
  }

  /**
   * Delete site by base URL (admin only)
   * DELETE /api/wut/sites/by-url?baseURL=...
   */
  deleteSiteByUrl(baseURL: string): Observable<void> {
    const params = new HttpParams().set('baseURL', baseURL);
    return this.http.delete<void>('/api/wut/sites/by-url', { params });
  }
}
