import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/classes/user.model';
import { LoginResponse } from '../../models/interface/mcp-server.interface';

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

export interface CurrentUserResponse {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  emailAddress?: string;
  roles?: string[];
  siteIds?: number[];
  [key: string]: unknown;
}

export interface CurrentUserSiteResponse {
  id: number;
  siteName: string;
  hostPart?: string;
  baseUrl?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  // Login user with username and password
  login(username: string, password: string): Observable<LoginResponse> {
    const loginPayload = { username, password };
    // Backend validates username/password from request body; no extra headers needed.
    return this.http.post<LoginResponse>('/api/wut/users/login', loginPayload, {
      withCredentials: true
    });
  }

  // Register new user
  register(registerData: any): Observable<any> {
    return this.http.post('/api/wut/users/register', registerData);
  }

  // Current user profile (includes siteIds in backend response)
  getCurrentUserWithSiteIds(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>('/api/wut/users/me');
  }

  // Current user's assigned sites
  getCurrentUserSites(): Observable<CurrentUserSiteResponse[]> {
    return this.http.get<CurrentUserSiteResponse[]>('/api/wut/sites/current-user');
  }

  // Get current user roles
  getCurrentUserRoles(): Observable<string[]> {
    return this.http.get<string[]>('/api/wut/users/me/roles');
  }

  // Get user by username
  getUserByUserName(userName: string): Observable<User> {
    return this.http.get<User>(`/api/wut/users/username/${userName}`);
  }

  // Get all users (admin only)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/wut/users');
  }

  // Get user by ID
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`/api/wut/users/${id}`);
  }

  // Create a new user
  createUser(user: User): Observable<User> {
    return this.http.post<User>('/api/wut/users', user);
  }

  // Admin-managed user provisioning
  createAdminUser(payload: AdminUserPayload): Observable<User> {
    return this.http.post<User>('/api/wut/users/admin/register', payload);
  }

  // Update user (admin only)
  updateUser(id: number, payload: any): Observable<User> {
    return this.http.put<User>(`/api/wut/users/${id}`, payload);
  }

  // Admin-managed user update (deprecated - use updateUser instead)
  updateAdminUser(id: number, payload: AdminUserPayload): Observable<User> {
    return this.updateUser(id, payload);
  }

  // Delete user (admin only)
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`/api/wut/users/${id}`);
  }

  // Admin-managed user delete (deprecated - use deleteUser instead)
  deleteAdminUser(id: number): Observable<void> {
    return this.deleteUser(id);
  }
}