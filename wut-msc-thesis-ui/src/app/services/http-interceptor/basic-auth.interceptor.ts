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
export class BasicAuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Always attach Basic auth; prefer logged-in user credentials and fallback to internal credentials.
    const currentUser = this.authService.currentUser;
    const username = currentUser?.userName || 'internal-user';
    const password = currentUser?.password || 'internal-pass';

    const authHeader = 'Basic ' + btoa(`${username}:${password}`);

    const authReq = req.clone({
      setHeaders: {
        Authorization: authHeader
      }
    });

    console.log('🔥 BasicAuthInterceptor applied:', req.url);
    return next.handle(authReq);
  }
}
