// auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { User } from '../../models/classes/user.model';
import { LoginResponse } from '../../models/interface/mcp-server.interface';
import { UserSessionService } from '../user-session/user-session.service';

const LOGIN_USER = 'currentUser';
const LOGIN_TOKEN = 'authToken';
const LOGIN_ROLES = 'authRoles';
const LOGIN_EXPIRES_IN_MS = 'authExpiresInMs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user$ = new BehaviorSubject<User | null>(null);
  private token$ = new BehaviorSubject<string | null>(null);
  private roles$ = new BehaviorSubject<string[]>([]);

  // public streams with types
  currentUser$ = this.user$.asObservable();
  tokenStream$ = this.token$.asObservable();
  rolesStream$ = this.roles$.asObservable();
  isLoggedIn$: Observable<boolean> = this.tokenStream$.pipe(map((token) => !!token));
  isUser$: Observable<boolean> = this.currentUser$.pipe(map(u => this.hasRole(u, 'user')));
  isAdmin$: Observable<boolean> = this.currentUser$.pipe(map(u => this.hasRole(u, 'admin')));
  isNormalUser$: Observable<boolean> = this.currentUser$.pipe(map(u => !this.hasRole(u, 'admin')));

  constructor(private sessionService: UserSessionService) { 
    const saved = this.sessionService.getItem<any>(LOGIN_USER);
    const savedToken = this.sessionService.getItem<string>(LOGIN_TOKEN);
    const savedRoles = this.sessionService.getItem<string[]>(LOGIN_ROLES) || [];

    const normalized = this.normalizeUser(saved);
    this.user$.next(normalized);
    this.token$.next(savedToken);
    this.roles$.next(savedRoles);
  }

  login(loginResponse: LoginResponse): void {
    const roles = loginResponse.roles || [];
    const user = this.normalizeUser({
      id: loginResponse.id,
      username: loginResponse.username,
      firstName: loginResponse.firstName,
      lastName: loginResponse.lastName,
      emailAddress: loginResponse.emailAddress,
      userRole: roles,
      accountId: loginResponse.accountId,
      displayName: loginResponse.displayName,
      active: loginResponse.active,
      isLoggedIn: true
    });

    this.user$.next(user);
    this.token$.next(loginResponse.token);
    this.roles$.next(roles);

    this.sessionService.setItem(LOGIN_USER, user);
    this.sessionService.setItem(LOGIN_TOKEN, loginResponse.token);
    this.sessionService.setItem(LOGIN_ROLES, roles);

    if (typeof loginResponse.expiresInMs === 'number') {
      this.sessionService.setItem(LOGIN_EXPIRES_IN_MS, loginResponse.expiresInMs);
    }
  }

  loginUser(user: User): void {
    const clean = this.normalizeUser(user)!;
    this.user$.next(clean);
    this.sessionService.setItem(LOGIN_USER, clean);
  }

  logout(): void {
    this.user$.next(null);
    this.token$.next(null);
    this.roles$.next([]);
    this.sessionService.removeItem(LOGIN_USER);
    this.sessionService.removeItem(LOGIN_TOKEN);
    this.sessionService.removeItem(LOGIN_ROLES);
    this.sessionService.removeItem(LOGIN_EXPIRES_IN_MS);
    this.sessionService.removeItem('selectedSiteId');
  }

  get currentUser(): User | null {
    return this.user$.value;
  }

  get token(): string | null {
    return this.token$.value;
  }

  get roles(): string[] {
    if (this.roles$.value.length) {
      return this.roles$.value;
    }

    const userRoles = this.currentUser?.userRole || [];
    return Array.isArray(userRoles) ? userRoles : [userRoles as any];
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  isAdminUser(user: User | null = this.currentUser): boolean {
    return this.hasRole(user, 'admin');
  }

  hasAnyRole(roles: string[], user: User | null = this.currentUser): boolean {
    return roles.some((role) => this.hasRole(user, role));
  }

  private hasRole(u: User | null, role: string): boolean {
    const normalizedExpected = this.normalizeRole(role);
    const rolePool = [
      ...(this.roles || []),
      ...((u?.userRole && Array.isArray(u.userRole)) ? u.userRole : (u?.userRole ? [u.userRole] : []))
    ];

    if (!rolePool.length) return false;

    const expected = this.normalizeRole(role);
    return rolePool.map((r) => this.normalizeRole(String(r))).includes(expected || normalizedExpected);
  }

  private normalizeRole(role: string): string {
    return role.toLowerCase().replace(/^role_/, '');
  }

  private normalizeUser(user: any): User | null {
    if (!user) {
      return null;
    }

    const id = user.id ?? user._id ?? user.userId ?? 0;
    const userName = user.userName ?? user._userName ?? user.username ?? user.name ?? '';

    if (!id && !userName) {
      return null;
    }

    const normalized = {
      id:       id,
      userName: userName,
      firstName: user.firstName ?? user._firstName ?? user.first_name ?? '',
      lastName: user.lastName ?? user._lastName ?? user.last_name ?? '',
      userEmail: user.userEmail ?? user._userEmail ?? user.email ?? user.emailAddress ?? '',
      phoneNumber: user.phoneNumber ?? user._phoneNumber ?? user.phone ?? '',
      password: user.password ?? user._password ?? '',
      userRole: user.userRole  ?? user._userRole  ?? user.roles ?? user.role ?? [],
      isLoggedIn: user.isLoggedIn ?? user._isLoggedIn ?? true,
      accountId: user.accountId ?? user._accountId ?? undefined,
      displayName: user.displayName ?? user._displayName ?? undefined,
      active: user.active ?? user._active ?? user.isActive ?? false
    } as User;

    return normalized;
  }
}
