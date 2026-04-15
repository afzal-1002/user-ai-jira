import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../../models/classes/user.model';
import { AdminApiService, AdminCreateUserPayload } from '../../../services/admin/admin-api.service';
import { UserService } from '../../../services/user/user.service';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css']
})
export class AdminUserManagementComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  isSaving = false;
  editingUserId: number | null = null;
  saveError = '';
  saveMessage = '';

  readonly roleOptions = ['ADMIN', 'USER', 'TESTER', 'MANAGER'];

  userForm = new FormGroup({
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    firstName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    emailAddress: new FormControl<string>('', { nonNullable: true }),
    phoneNumber: new FormControl<string>('', { nonNullable: true }),
    password: new FormControl<string>('', { nonNullable: true }),
    roles: new FormControl<string[]>(['USER'], { nonNullable: true, validators: [Validators.required] })
  });

  constructor(
    private userService: UserService,
    private adminApiService: AdminApiService
  ) {}

  ngOnInit(): void {
    this.refreshUsers();
  }

  refreshUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  editUser(user: User): void {
    this.editingUserId = user.id;
    this.saveMessage = '';
    this.saveError = '';
    this.userForm.patchValue({
      username: user.userName || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      emailAddress: user.userEmail || '',
      phoneNumber: user.phoneNumber || '',
      password: '',
      roles: Array.isArray(user.userRole) ? user.userRole : ['USER']
    });
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.userForm.reset({
      username: '',
      firstName: '',
      lastName: '',
      emailAddress: '',
      phoneNumber: '',
      password: '',
      roles: ['USER']
    });
  }

  saveUser(): void {
    this.saveError = '';
    this.saveMessage = '';

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    if (!this.editingUserId && !this.userForm.controls.password.value) {
      this.saveError = 'Password is required when creating a new user.';
      return;
    }

    this.isSaving = true;
    const payload = this.buildPayload();

    const request$ = this.editingUserId
      ? this.userService.updateAdminUser(this.editingUserId, payload)
      : this.adminApiService.createUser(payload as AdminCreateUserPayload);

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.saveMessage = this.editingUserId ? 'User updated successfully.' : 'User created successfully.';
        this.cancelEdit();
        this.refreshUsers();
      },
      error: (error) => {
        this.isSaving = false;
        this.saveError = error?.error?.message || 'Unable to save user.';
      }
    });
  }

  deleteUser(user: User): void {
    if (!user.id) {
      return;
    }

    const confirmed = confirm(`Delete user ${user.userName}?`);
    if (!confirmed) {
      return;
    }

    this.userService.deleteAdminUser(user.id).subscribe({
      next: () => {
        this.saveMessage = 'User deleted successfully.';
        this.refreshUsers();
      },
      error: (error) => {
        this.saveError = error?.error?.message || 'Unable to delete user.';
      }
    });
  }

  onRoleChange(role: string, checked: boolean): void {
    const roles = [...this.userForm.controls.roles.value];

    if (checked && !roles.includes(role)) {
      roles.push(role);
    }

    if (!checked) {
      const updated = roles.filter((r) => r !== role);
      this.userForm.controls.roles.setValue(updated.length ? updated : ['USER']);
      return;
    }

    this.userForm.controls.roles.setValue(roles);
  }

  hasRole(role: string): boolean {
    return this.userForm.controls.roles.value.includes(role);
  }

  toRoles(roles: string[] | string | null | undefined): string {
    if (!roles) return '-';
    if (Array.isArray(roles)) return roles.join(', ');
    return roles;
  }

  private buildPayload(): any {
    const { username, firstName, lastName, emailAddress, phoneNumber, password, roles } = this.userForm.getRawValue();

    const payload: any = {
      username,
      firstName,
      lastName,
      emailAddress: emailAddress || undefined,
      phoneNumber: phoneNumber || undefined,
      roles
    };

    if (password) {
      payload.password = password;
    }

    return payload;
  }
}
