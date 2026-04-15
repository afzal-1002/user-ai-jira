// auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { User } from '../../models/classes/user.model';
import { UserSessionService } from '../user-session/user-session.service';

const LOGIN_USER = 'currentUser';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user$ = new BehaviorSubject<User | null>(null);

  // public streams with types
  currentUser$ = this.user$.asObservable();
  isLoggedIn$: Observable<boolean> = this.currentUser$.pipe(map(u => !!u));
  isUser$: Observable<boolean> = this.currentUser$.pipe(map(u => this.hasRole(u, 'user')));
  isAdmin$: Observable<boolean> = this.currentUser$.pipe(map(u => this.hasRole(u, 'admin')));

  constructor(private sessionService: UserSessionService) { 
    // On initialization, try to restore user from session storage
    const saved = this.sessionService.getItem<any>(LOGIN_USER);
    console.log('🔍 AuthService constructor - restored from storage:', saved);
    const normalized = this.normalizeUser(saved);
    this.user$.next(normalized);
    console.log('✅ AuthService initialized with user:', normalized);
  }

  loginUser(user: User): void {
    const clean = this.normalizeUser(user)!;
    this.user$.next(clean);
    this.sessionService.setItem(LOGIN_USER, clean);
  }

  logout(): void {
    this.user$.next(null);
    this.sessionService.removeItem(LOGIN_USER);
  }

  get currentUser(): User | null {
    // Single source of truth during the app lifetime is the BehaviorSubject.
    // It is initialized from session storage in the constructor.
    const user = this.user$.value;
    console.log('👁️ currentUser getter called (from BehaviorSubject):', user);
    return user;
  }

  isAdminUser(user: User | null = this.currentUser): boolean {
    return this.hasRole(user, 'admin');
  }

  hasAnyRole(roles: string[], user: User | null = this.currentUser): boolean {
    return roles.some((role) => this.hasRole(user, role));
  }

  private hasRole(u: User | null, role: string): boolean {
    if (!u || !u.userRole) return false;
    const expected = this.normalizeRole(role);
    const roles = Array.isArray(u.userRole) ? u.userRole : [u.userRole];
    return roles.map((r) => this.normalizeRole(r)).includes(expected);
  }

  private normalizeRole(role: string): string {
    return role.toLowerCase().replace(/^role_/, '');
  }

  private normalizeUser(user: any): User | null {
    if (!user) {
      console.log('📭 normalizeUser: No user provided');
      return null;
    }
    
    // Validate that user has at least an identifier
    const id = user.id ?? user._id ?? user.userId ?? 0;
    const userName = user.userName ?? user._userName ?? user.username ?? user.name ?? '';
    
    console.log('🔧 normalizeUser - Processing user:', { id, userName, userRole: user.userRole || user._userRole });
    
    // If we have neither id nor username, user is invalid
    if (!id && !userName) {
      console.warn('❌ normalizeUser: User has no valid identifier (id or userName)');
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
      active: user.active ?? user._active ?? user.isActive ?? false,
      baseUrl: user.baseUrl ?? user._baseUrl ?? undefined
    } as User;
    
    console.log('✅ normalizeUser - Normalized result:', normalized);
    return normalized;
  }
}
