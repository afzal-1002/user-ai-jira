import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentUser = this.authService.currentUser;
    console.log('🔐 Auth Guard Check:', { 
      hasUser: !!currentUser, 
      user: currentUser,
      url: state.url 
    });
    
    if (currentUser && (currentUser.id || currentUser.userName)) {
      // User is logged in (has either id or userName), allow access
      console.log('✅ Auth guard: User is authenticated', currentUser);
      return true;
    } else {
      // User is not logged in, redirect to login
      console.warn('⚠️ Auth guard: User is not authenticated. Redirecting to login.', currentUser);
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }
}
