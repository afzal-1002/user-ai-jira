import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  baseUrl?: string;
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

  assignSite(siteId: number, payload: AdminAssignSitePayload): Observable<any> {
    return this.http.post(`/api/wut/sites/${siteId}/assign`, payload);
  }
}
