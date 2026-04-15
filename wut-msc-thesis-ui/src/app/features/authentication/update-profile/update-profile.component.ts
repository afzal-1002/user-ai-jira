import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user/user.service';
import { AuthService } from '../../../services/auth/auth.service';
import { User } from '../../../models/classes/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-profile.component.html',
  styleUrls: ['./update-profile.component.css']
})
export class UpdateProfileComponent implements OnInit {
  updateForm!: FormGroup;
  userId!: number;
  userData: User | null = null;
  isLoading = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user from AuthService
    const currentUser = this.authService.currentUser;
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
      this.userData = currentUser;
      this.initializeForm();
    } else {
      this.errorMessage = 'User not found. Please login again.';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  }

  initializeForm(): void {
    if (this.userData) {
      this.updateForm = this.fb.group({
        userName: [this.userData.userName, Validators.required],
        firstName: [this.userData.firstName, Validators.required],
        lastName: [this.userData.lastName, Validators.required],
        emailAddress: [this.userData.userEmail, [Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
        phoneNumber: [this.userData.phoneNumber, [Validators.pattern(/^\+?\d{10,15}$/)]],
        displayName: [this.userData.displayName || '', Validators.required],
        password: ['', Validators.minLength(6)],
        isActive: [this.userData.isLoggedIn]
      });
    }
  }

  onSubmit(): void {
    if (this.updateForm.invalid) {
      this.updateForm.markAllAsTouched();
      console.log('Form is invalid:', this.updateForm.errors);
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = this.updateForm.value;
    
    // Prepare update payload
    const updatePayload = {
      userName: formData.userName,
      firstName: formData.firstName,
      lastName: formData.lastName,
      emailAddress: formData.emailAddress,
      phoneNumber: formData.phoneNumber,
      displayName: formData.displayName,
      isActive: formData.isActive,
      ...(formData.password && { password: formData.password }) // Include password only if provided
    };

    console.log('📤 Updating user profile:', updatePayload);

    this.userService.updateUser(this.userId, updatePayload as any).subscribe(
      (response: any) => {
        this.isSubmitting = false;
        console.log('✅ Profile updated successfully:', response);
        this.successMessage = 'Profile updated successfully!';
        
        // Update AuthService with new user data
        const updatedUser = new User(
          response.id ?? this.userData?.id ?? 0,
          response.userName ?? formData.userName,
          response.firstName ?? formData.firstName,
          response.lastName ?? formData.lastName,
          response.emailAddress ?? formData.emailAddress,
          response.phoneNumber ?? formData.phoneNumber,
          formData.password || this.userData?.password || '',
          this.userData?.userRole || [],
          response.isActive ?? false,
          this.userData?.accountId,
          response.displayName || formData.displayName,
          response.isActive ?? false,
          this.userData?.baseUrl
        );
        
        this.authService.loginUser(updatedUser);
        
        // Redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/view-profile']);
        }, 2000);
      },
      (error) => {
        this.isSubmitting = false;
        console.error('❌ Failed to update profile:', error);
        this.errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
      }
    );
  }

  goBack(): void {
    this.router.navigate(['/view-profile']);
  }
}
