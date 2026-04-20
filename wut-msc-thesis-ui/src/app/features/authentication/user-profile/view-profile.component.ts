import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.css']
})
export class ViewProfileComponent implements OnInit {
  isLoading = true;
  errorMessage = '';
  appUser: any = null;

  constructor(
    public router: Router,
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

    this.isLoading = false;
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
