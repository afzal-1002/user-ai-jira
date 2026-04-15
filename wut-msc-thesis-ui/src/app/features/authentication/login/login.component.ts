import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { User } from '../../../models/classes/user.model';
import { UserService } from '../../../services/user/user.service';
import { AuthService } from '../../../services/auth/auth.service';
import { McpFrontendService } from '../../../services/mcp/mcp-frontend.service';
import { McpFrontendStateService } from '../../../services/mcp/mcp-frontend-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  invalidCredentials = false;
  isLoading = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    private userService: UserService,
    private mcpFrontendService: McpFrontendService,
    private mcpFrontendStateService: McpFrontendStateService
  ) {}

  ngOnInit(): void {
    // No need to fetch all users anymore
  }


  // Strongly typed form controls (non-nullable)
  loginForm = new FormGroup({
    userName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    userPassword: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  private hasRole(user: User, role: string): boolean {
    const roles = Array.isArray(user.userRole) ? user.userRole : [user.userRole];
    return roles.includes(role);
  }

  loginUser(): void {
    this.invalidCredentials = false;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { userName, userPassword } = this.loginForm.getRawValue();

    // Call backend login endpoint
    this.userService.login(userName, userPassword).subscribe(
      (response: any) => {
        this.isLoading = false;
        console.log('✅ Login successful - Backend response:', response);

        // Ensure we have a valid ID - use username as fallback
        const userId = response.id ?? response.userId ?? response._id ?? userName;
        
        // Create a plain object (not User class instance) for serialization
        const userObject = {
          id: userId,
          userName: response.username ?? userName ?? '',
          firstName: response.firstName ?? response.firstname ?? 'User',
          lastName: response.lastName ?? response.lastname ?? '',
          userEmail: response.emailAddress ?? response.email ?? '',
          phoneNumber: response.phoneNumber ?? '',
          password: userPassword,
          userRole: Array.isArray(response.roles) ? response.roles : ['user'],
          isLoggedIn: true,
          accountId: response.accountId ?? undefined,
          displayName: response.displayName ?? undefined,
          active: response.active ?? false,
          baseUrl: response.baseUrl ?? undefined
        };

        console.log('👤 User object prepared:', userObject);
        console.log('📦 Saving to session storage...');

        // Save the plain object directly to auth service (will be persisted via sessionStorage)
        this.authService.loginUser(userObject as any);
        
        console.log('📝 User persisted to auth service');
        
        // Verify it was saved by reading back from currentUser
        setTimeout(() => {
          const savedUser = this.authService.currentUser;
          console.log('✔️ Verification - User restored from auth service:', savedUser);
        }, 100);

        // Navigate based on role
        const roles = Array.isArray(response.roles) ? response.roles : [];
        const userRolesLower = roles.map((r: string) => r.toLowerCase());
        
        // Load MCP context for the new site -> project -> issue user flow.
        this.mcpFrontendService.getContext().subscribe({
          next: (context) => this.mcpFrontendStateService.setContext(context),
          error: () => this.mcpFrontendStateService.clear()
        });

        if (userRolesLower.includes('admin')) {
          console.log('➡️ Navigating to admin-dashboard');
          this.router.navigate(['admin-dashboard', userId]);
        } else if (userRolesLower.includes('user') || roles.length === 0) {
          console.log('➡️ Navigating to user-dashboard');
          this.router.navigate(['user-dashboard', userId]);
        } else {
          console.log('➡️ Navigating to home');
          this.router.navigate(['/']);
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('❌ Login failed:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error);
        this.invalidCredentials = true;
      }
    );
  }
}
