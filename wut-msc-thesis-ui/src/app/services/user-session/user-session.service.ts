import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UserSessionService {
  
private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private storage: Storage | null = this.isBrowser ? window.sessionStorage : null;

  setItem<T>(key: string, value: T): void {
    if (!this.storage) return;
    this.storage.setItem(key, JSON.stringify(value));
  }

  getItem<T>(key: string): T | null {
    if (!this.storage) return null;
    const user = this.storage.getItem(key);
    if (!user) return null;
    try { return JSON.parse(user) as T; } catch { return null; }
  }

  removeItem(key: string): void {
    if (!this.storage) return;
    this.storage.removeItem(key);
  }

  clear(): void {
    if (!this.storage) return;
    this.storage.clear();
  }
}
