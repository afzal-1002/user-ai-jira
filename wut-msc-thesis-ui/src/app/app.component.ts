import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationError, Event } from '@angular/router';
import { HeaderComponent } from './shared/component/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'thesis-bug-ui';
  isLoogedIn: boolean = true;
  constructor(private router: Router) {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        console.log('🚦 NavigationStart:', event.url);
      } else if (event instanceof NavigationEnd) {
        console.log('✅ NavigationEnd:', event.urlAfterRedirects);
        try {
          console.log('📍 Router state snapshot:', this.router.routerState.snapshot);
        } catch (e) {
          console.warn('Could not read router state snapshot', e);
        }
      } else if (event instanceof NavigationError) {
        console.error('❌ NavigationError:', event.error);
      }
    });
    // Dump router config for debugging
    try {
      console.log('🧭 Router config:', this.router.config.map(r => ({ path: r.path, component: (r.component as any)?.name }))); 
    } catch (e) {
      console.warn('Could not dump router config', e);
    }
  }
}
