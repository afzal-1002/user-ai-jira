import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/classes/user.model';

export interface JiraPlatformConfig {
  id?: number;
  siteName: string;
  hostPart?: string;
  baseUrl?: string;
  username: string;
  jiraToken?: string;
}

export interface AdminUserPayload {
  username: string;
  firstName: string;
  lastName: string;
  password?: string;
  emailAddress?: string;
  phoneNumber?: string;
  roles: string[];
}

export interface AssignSitePayload {
  userId: number;
  defaultForUser: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  // Login user with username and password
  login(username: string, password: string): Observable<any> {
    const loginPayload = { username, password };
    // Backend validates username/password from request body; no extra headers needed.
    return this.http.post('/api/wut/users/login', loginPayload, {
      withCredentials: true
    });
  }

  // Register new user
  register(registerData: any): Observable<any> {
    return this.http.post('/api/wut/users/register', registerData);
  }

  // Admin-managed Jira site configuration
  createSite(payload: JiraPlatformConfig): Observable<any> {
    return this.http.post('/api/wut/sites', payload);
  }

  getSites(): Observable<JiraPlatformConfig[]> {
    return this.http.get<JiraPlatformConfig[]>('/api/wut/sites');
  }

  assignSite(siteId: number, payload: AssignSitePayload): Observable<any> {
    return this.http.post(`/api/wut/sites/${siteId}/assign`, payload);
  }

  // Get current logged-in user from Jira with baseUrl
  getCurrentUser(baseUrl: string): Observable<any> {
    const params = { baseUrl };
    return this.http.get('/api/wut/jira-users/me', { params });
  }

  // Get user by username
  getUserByUserName(userName: string): Observable<User> {
    return this.http.get<User>(`/api/wut/users/username/${userName}`);
  }

  // Get all users
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`/api/wut/users`);
  }

  // Get user by ID
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`/api/wut/users/${id}`);
  }

  // Create a new user
  createUser(user: User): Observable<User> {
    return this.http.post<User>(`/api/wut/users`, user);
  }

  // Admin-managed user provisioning
  createAdminUser(payload: AdminUserPayload): Observable<User> {
    return this.http.post<User>('/api/wut/users/admin/register', payload);
  }

  // Update user
  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`/api/wut/users/${id}`, user);
  }

  // Admin-managed user update
  updateAdminUser(id: number, payload: AdminUserPayload): Observable<User> {
    return this.http.put<User>(`/api/wut/admin/users/${id}`, payload);
  }

  // Delete user
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`/api/wut/users/${id}`);
  }

  // Admin-managed user delete
  deleteAdminUser(id: number): Observable<void> {
    return this.http.delete<void>(`/api/wut/admin/users/${id}`);
  }
}