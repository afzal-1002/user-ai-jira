import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { User } from '../../../models/classes/user.model';
import { UserService } from '../../../services/user/user.service';
import { UserSessionService } from '../../../services/user-session/user-session.service';
import { AuthService } from '../../../services/auth/auth.service';


@Component({
  selector: 'app-user-dashboard',
   imports: [NgFor, NgIf], 
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  userList: User[] = [];
  user: User | null | undefined = null;
  private readonly adminOnlyTitles = new Set(['Site Configuration', 'User Management', 'Roles & Access']);
 
 features = [
   // User features
   { icon: '🌐', title: 'Select Site',    description: 'Choose one of your assigned Jira sites to work with', button: 'Select Site', link: '/mcp/projects' },
   { icon: '📁', title: 'Projects',       description: 'Manage projects in your selected site', button: 'View Projects',  link: '/mcp/projects' },
  { icon: '🐞', title: 'Bugs',           description: 'Track and report bugs for your selected site', button: 'View Bugs',      link: '/mcp/projects' },
  { icon: '📊', iconImage: 'assets/image/ai-images/ai-02.png', title: 'Estimations Analysis', description: 'AI estimations, model comparison, research, and history', button: 'Open Estimations Analysis', link: '/user/estimations-analysis' },
  { icon: '📋', title: 'API Logs', description: 'Monitor and analyze API calls and errors', button: 'View API Logs', link: '/api-logs' },
    { icon: '🔔', title: 'Notifications',  description: 'Stay up to date',            button: 'Alerts',         link: '/notifications' },
    { icon: '👤', title: 'Profile',        description: 'Edit your profile',          button: 'My Profile',     link: '/view-profile' },

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

        // Defensive filtering: normal users should never see admin-only cards.
        this.features = this.features.filter((feature) => !this.adminOnlyTitles.has(feature.title));
   
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

   viewProfile(): void {
    if (this.user?.id != null) {
      this.router.navigate(['view-profile']);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  } 
 }