import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../../models/classes/user.model';
import { UserService } from '../../../services/user/user.service';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgIf, RouterLink, ReactiveFormsModule, NgClass],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})

export class RegisterComponent {
  constructor(private router: Router, private userService: UserService) { }

  newUser: User | null = null;
  isLoading = false;
  registrationError = '';

  signUpForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]),
    baseUrl: new FormControl('', Validators.required),
    jiraToken: new FormControl('', Validators.required),
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    emailAddress: new FormControl('', [
      Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    ]),
    phoneNumber: new FormControl('', [
      Validators.pattern(/^\+?\d{10,15}$/)
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(25)
    ]),
    roles: new FormControl<string[]>([], Validators.required)
  });


  registerUser() {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      console.log('Form Valid:', this.signUpForm.valid);
      console.log('Form Data:', this.signUpForm.value);
      return;
    }

    this.isLoading = true;
    this.registrationError = '';
    const formData = this.signUpForm.value;

    // Prepare the registration payload
    const registerPayload = {
      baseUrl: formData.baseUrl,
      username: formData.username,
      jiraToken: formData.jiraToken,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber || undefined,
      password: formData.password,
      emailAddress: formData.emailAddress || undefined,
      roles: Array.isArray(formData.roles) ? formData.roles : []
    };

    console.log('📤 Sending registration data:', registerPayload);

    this.userService.register(registerPayload).subscribe(
      (response: any) => {
        this.isLoading = false;
        console.log('✅ Registration successful:', response);

        // Create User object from response
        const user = new User(
          response.id ?? 0,
          response.username ?? formData.username ?? '',
          response.firstName ?? formData.firstName ?? '',
          response.lastName ?? formData.lastName ?? '',
          response.emailAddress ?? formData.emailAddress ?? '',
          response.phoneNumber ?? formData.phoneNumber ?? '',
          formData.password ?? '',
          Array.isArray(response.roles) ? response.roles : ['USER'],
          response.active ?? false,
          response.accountId ?? undefined,
          response.displayName ?? undefined,
          response.active ?? false,
          response.baseUrl ?? formData.baseUrl
        );

        this.newUser = user;
        console.log('✅ User registered:', user);
        this.signUpForm.reset();

        // Navigate to profile after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/registerProfile', user.id]);
        }, 2000);
      },
      (error) => {
        this.isLoading = false;
        console.error('❌ Registration failed:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.error);
        this.registrationError = error.error?.message || 'Registration failed. Please try again.';
      }
    );
  }

  getValidationClass(controlName: string) {
    const control = this.signUpForm.get(controlName);
    if (!control) return '';
    if (control.invalid && (control.touched || control.dirty)) return 'is-invalid';
    if (control.valid && (control.touched || control.dirty)) return 'is-valid';
    return '';
  }

  onRoleChange(role: string, event: any) {
    const rolesControl = this.signUpForm.get('roles');
    if (!rolesControl) return;

    let currentRoles = rolesControl.value as string[];
    if (!Array.isArray(currentRoles)) {
      currentRoles = [];
    }

    if (event.target.checked) {
      // Add role if checked
      if (!currentRoles.includes(role)) {
        currentRoles.push(role);
      }
    } else {
      // Remove role if unchecked
      currentRoles = currentRoles.filter(r => r !== role);
    }

    rolesControl.setValue(currentRoles);
    rolesControl.markAsTouched();
  }

  get username() {
    return this.signUpForm.get('username');
  }

  get baseUrl() {
    return this.signUpForm.get('baseUrl');
  }

  get jiraToken() {
    return this.signUpForm.get('jiraToken');
  }

  get emailAddress() {
    return this.signUpForm.get('emailAddress');
  }

  get phoneNumber() {
    return this.signUpForm.get('phoneNumber');
  }

  get password() {
    return this.signUpForm.get('password');
  }

  get firstName() {
    return this.signUpForm.get('firstName');
  }

  get lastName() {
    return this.signUpForm.get('lastName');
  }

  get roles() {
    return this.signUpForm.get('roles');
  }
}

