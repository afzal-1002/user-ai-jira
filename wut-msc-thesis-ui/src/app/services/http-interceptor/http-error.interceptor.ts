import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    console.log('🔵 HTTP Request:', request.method, request.url);
    console.log('📤 Payload:', request.body);

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('🔴 HTTP Error:', error);
        console.error('Status:', error.status);
        console.error('Status Text:', error.statusText);
        console.error('Error Response:', error.error);
        
        return throwError(() => error);
      })
    );
  }
}
