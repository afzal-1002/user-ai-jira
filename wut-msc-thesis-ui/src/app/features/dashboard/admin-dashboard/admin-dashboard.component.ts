// admin-dashboard.component.ts
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

import { User } from '../../../models/classes/user.model';
import { UserService } from '../../../services/user/user.service';
import { UserSessionService } from '../../../services/user-session/user-session.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink], 
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'] // <-- plural
})
export class AdminDashboardComponent {
  userList: User[] = [];
  user: User | null | undefined = null;

features = [
  // User features
  { icon: '📁', title: 'Projects',       description: 'Manage your projects',       button: 'View Projects',  link: '/projects' },
  { icon: '🐞', title: 'Bugs',           description: 'Track and report bugs',      button: 'View Bugs',      link: '/mcp/projects' },
  { icon: '📊', iconImage: 'assets/image/ai-images/ai-02.png', title: 'Estimation Analysis', description: 'AI estimation, history, and reports', button: 'Open Estimation Analysis', link: '/admin/estimation-analysis' },

  // Admin-specific features
  { icon: '⚙️', title: 'Site Configuration', description: 'Manage site setup and user assignments', button: 'Open Site Configuration', link: '/admin/site-configuration' },
  { icon: '👥', title: 'User Management', description: 'Add, edit, or remove users', button: 'Manage Users',   link: '/admin/users' },
  { icon: '🛡️', title: 'Roles & Access', description: 'Manage roles and permissions', button: 'Access Control', link: '/admin/roles' },
  { icon: '📦', title: 'Modules',        description: 'Enable or disable modules',  button: 'Manage Modules',  link: '/admin/modules' },
  { icon: '👤', title: 'Profile',        description: 'Edit your profile',          button: 'My Profile',     link: '/view-profile' }
];


  constructor(
    private userService: UserService,
    private authService: AuthService,
    private session: UserSessionService, 
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.getAllUsers().subscribe(
      (users: User[]) => {
        this.userList = users;
        // Use authService instead of sessionStorage
        this.user = this.authService.currentUser;
        const userIdParam = this.activatedRoute.snapshot.paramMap.get('userId');
        const userId = userIdParam ? parseInt(userIdParam, 10) : null;

        if (userId != null) {
          this.user = this.userList.find(u => u.id === userId) ?? this.user;
        }

        console.log(this.user ? '✅ User found:' : '❌ No user found', this.user);
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
  }

  goToLink(link: string): void {
    console.log('Navigating to:', link);
    const currentUser = this.authService.currentUser;
    console.log('Current user from AuthService:', currentUser);

    // If there is truly no logged-in user, send to login.
    if (!currentUser) {
      console.warn('No user in AuthService. Redirecting to login page.');
      this.router.navigate(['/login']);
      return;
    }

    if (link.startsWith('/admin') && !this.authService.isAdminUser(currentUser)) {
      console.warn('Access denied. User is not an admin.');
      alert('Access denied. Admins only.');
      return;
    }

    // Always navigate by absolute URL to avoid accidental relative path routing.
    const target = link.startsWith('/') ? link : `/${link}`;
    this.router.navigateByUrl(target);
  }
}
