import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { McpFrontendStateService } from '../mcp/mcp-frontend-state.service';

@Injectable()
export class JwtAuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private mcpFrontendStateService: McpFrontendStateService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.token;
    const selectedSiteId = this.mcpFrontendStateService.selectedSiteId;

    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (selectedSiteId) {
      headers['X-Site-Id'] = String(selectedSiteId);
    }

    const authReq = Object.keys(headers).length
      ? req.clone({ setHeaders: headers })
      : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.shouldForceLogoutOn401(error, req)) {
          this.authService.logout();
          this.mcpFrontendStateService.clear();
          this.router.navigate(['/login']);
        }

        return throwError(() => error);
      })
    );
  }

  private shouldForceLogoutOn401(error: HttpErrorResponse, req: HttpRequest<any>): boolean {
    if (error.status !== 401) {
      return false;
    }

    // If there is no bearer token in session, this is not a valid auth session to clear.
    if (!this.authService.token) {
      return false;
    }

    // Never force-logout for explicit login attempts.
    if (req.url.includes('/api/wut/users/login')) {
      return false;
    }

    // Some backend routes may return a Basic challenge (WWW-Authenticate: Basic ...).
    // Do not destroy JWT session for those responses.
    const wwwAuthenticate = error.headers?.get('WWW-Authenticate') || error.headers?.get('www-authenticate') || '';
    if (wwwAuthenticate.toLowerCase().includes('basic')) {
      return false;
    }

    return true;
  }
}
