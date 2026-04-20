import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { UserService } from '../../../services/user/user.service';
import { AuthService } from '../../../services/auth/auth.service';
import { McpFrontendService } from '../../../services/mcp/mcp-frontend.service';
import { McpFrontendStateService } from '../../../services/mcp/mcp-frontend-state.service';
import { LoginResponse } from '../../../models/interface/mcp-server.interface';

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
      (response: LoginResponse) => {
        this.isLoading = false;
        this.authService.login({
          id: response.id,
          firstName: response.firstName,
          lastName: response.lastName,
          accountId: response.accountId,
          displayName: response.displayName,
          emailAddress: response.emailAddress,
          username: response.username ?? userName,
          roles: Array.isArray(response.roles) ? response.roles : [],
          active: response.active,
          token: response.token,
          tokenType: response.tokenType,
          expiresInMs: response.expiresInMs
        });

        this.mcpFrontendStateService.clear();

        // Navigate based on role
        const roles = Array.isArray(response.roles) ? response.roles : [];
        const userRolesLower = roles.map((r: string) => r.toLowerCase());

        if (userRolesLower.includes('admin')) {
          this.router.navigate(['/admin']);
        } else {
          this.mcpFrontendService.getContext().subscribe({
            next: (context) => {
              this.mcpFrontendStateService.setContext(context);
              this.router.navigate(['/mcp']);
            },
            error: () => {
              this.router.navigate(['/mcp']);
            }
          });
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
