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

features: Array<{ icon: string; iconImage?: string; title: string; description: string; button: string; link: string }> = [
  { icon: '🌐', title: 'Jira Domains', description: 'Configure Jira domains and base URLs', button: 'Manage Jira Domains', link: '/admin/jira-domain' },
  { icon: '🗂️', title: 'Jira Projects', description: 'Register Jira project keys and names', button: 'Manage Jira Projects', link: '/admin/projects' },
  { icon: '🔐', title: 'GitHub Credentials', description: 'Store encrypted GitHub tokens and usernames', button: 'Manage Credentials', link: '/admin/credentials' },
  { icon: '🔗', title: 'Repository Mapping', description: 'Link projects to repositories and default branches', button: 'Manage Mappings', link: '/admin/repositories' },
  { icon: '👥', title: 'User Management', description: 'Create and maintain platform users', button: 'Manage Users', link: '/admin/users' },
  { icon: '📁', title: 'User Project View', description: 'Open user dashboard/project selection flow', button: 'Open Dashboard', link: '/dashboard' },
  { icon: '🐞', title: 'Issue Selection', description: 'Open issue selection and triage pages', button: 'Open Issues', link: '/issues' },
  { icon: '👤', title: 'Profile', description: 'Review and edit your profile details', button: 'My Profile', link: '/view-profile' }
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
