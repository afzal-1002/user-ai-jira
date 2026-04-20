import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class HttpAuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Start with withCredentials to allow cookies if backend uses them
    let authRequest = request.clone({ withCredentials: true });

    // Add Basic Authorization header if we have stored username/password
    const currentUser = this.authService.currentUser;
    if (currentUser && currentUser.userName && currentUser.password) {
      try {
        const credentials = `${currentUser.userName}:${currentUser.password}`;
        const encoded = btoa(credentials);
        authRequest = authRequest.clone({ setHeaders: { Authorization: `Basic ${encoded}` } });
        console.log('🔐 HTTP Auth Interceptor - Added Basic Authorization header for user:', { userName: currentUser.userName });
      } catch (err) {
        console.warn('⚠️ HTTP Auth Interceptor - Failed to encode Basic credentials', err);
      }
    } else {
      console.log('🔐 HTTP Auth Interceptor - No stored credentials, proceeding with request only with credentials flag');
    }

    console.log('🔐 HTTP Auth Interceptor - Outgoing request:', { url: authRequest.url, method: authRequest.method });
    return next.handle(authRequest);
  }
}
