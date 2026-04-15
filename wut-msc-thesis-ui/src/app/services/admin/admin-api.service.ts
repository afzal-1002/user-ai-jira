import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminCreateUserPayload {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  emailAddress?: string;
  phoneNumber?: string;
  roles: string[];
}

export interface AdminCreateSitePayload {
  siteName: string;
  hostPart?: string;
  baseUrl?: string;
  username: string;
  jiraToken: string;
}

export interface AdminAssignSitePayload {
  userId: number;
  defaultForUser: boolean;
}

export interface AdminSite {
  id: number;
  siteName: string;
  hostPart?: string;
  baseURL?: string;
  baseUrl?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  constructor(private http: HttpClient) {}

  createUser(payload: AdminCreateUserPayload): Observable<any> {
    return this.http.post('/api/wut/users/admin/register', payload);
  }

  createSite(payload: AdminCreateSitePayload): Observable<any> {
    return this.http.post('/api/wut/sites', payload);
  }

  getSites(): Observable<AdminSite[]> {
    return this.http.get<AdminSite[]>('/api/wut/sites');
  }

  getSitesByUsername(username: string): Observable<AdminSite[]> {
    const params = new HttpParams().set('username', username);
    return this.http.get<AdminSite[]>('/api/wut/sites/by-username', { params });
  }

  getSiteByHostPart(hostPart: string): Observable<AdminSite> {
    const params = new HttpParams().set('hostPart', hostPart);
    return this.http.get<AdminSite>('/api/wut/sites/by-host-part', { params });
  }

  updateSiteName(siteId: number, newSiteName: string): Observable<AdminSite> {
    const params = new HttpParams().set('newSiteName', newSiteName);
    return this.http.put<AdminSite>(`/api/wut/sites/${siteId}/name`, {}, { params });
  }

  updateSiteUrl(siteId: number, newBaseURL: string): Observable<AdminSite> {
    const params = new HttpParams().set('newBaseURL', newBaseURL);
    return this.http.put<AdminSite>(`/api/wut/sites/${siteId}/url`, {}, { params });
  }

  assignSite(siteId: number, payload: AdminAssignSitePayload): Observable<any> {
    return this.http.post(`/api/wut/sites/${siteId}/assign`, payload);
  }

  deleteSiteById(siteId: number): Observable<void> {
    return this.http.delete<void>(`/api/wut/sites/${siteId}`);
  }

  deleteSiteByName(siteName: string): Observable<void> {
    const params = new HttpParams().set('siteName', siteName);
    return this.http.delete<void>('/api/wut/sites/by-name', { params });
  }

  deleteSiteByUrl(baseURL: string): Observable<void> {
    const params = new HttpParams().set('baseURL', baseURL);
    return this.http.delete<void>('/api/wut/sites/by-url', { params });
  }
}
