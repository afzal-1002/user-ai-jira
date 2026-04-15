import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../services/user/user.service';
import { AuthService } from '../../../services/auth/auth.service';

interface JiraUser {
  self?: string;
  accountId?: string;
  accountType?: string;
  emailAddress?: string;
  avatarUrls?: {
    url48x48?: string;
    url24x24?: string;
    url16x16?: string;
    url32x32?: string;
  };
  displayName?: string;
  active?: boolean;
  timeZone?: string;
  locale?: string;
}

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [NgIf, NgFor, NgClass],
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.css']
})
export class ViewProfileComponent implements OnInit {
  jiraUser: JiraUser | null = null;
  isLoading = true;
  errorMessage = '';
  appUser: any = null;

  constructor(
    public router: Router,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Guard ensures user is authenticated before reaching this component
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Get current app user
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.appUser = currentUser;
    } else {
      this.isLoading = false;
      this.errorMessage = 'User data not available. Please login again.';
      return;
    }

    // Get Jira user details with baseUrl (optional - don't block if it fails)
    if (currentUser.baseUrl) {
      this.userService.getCurrentUser(currentUser.baseUrl).subscribe(
        (response: any) => {
          this.isLoading = false;
          console.log('✅ Jira user profile loaded:', response);
          this.jiraUser = response;
        },
        (error) => {
          // Don't block page load if Jira fetch fails - still show app user info
          this.isLoading = false;
          console.warn('⚠️ Could not load Jira profile:', error);
          // Set jiraUser to null so template can show alternative content
          this.jiraUser = null;
          // Show warning but don't block the entire page
          if (error.status === 401) {
            console.warn('⚠️ Unauthorized to access Jira profile. Make sure your Jira token is valid.');
          }
        }
      );
    } else {
      this.isLoading = false;
      console.warn('⚠️ User baseUrl is not set');
    }
  }

  editProfile(): void {
    if (this.appUser?.id) {
      this.router.navigate(['/update-profile', this.appUser.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
