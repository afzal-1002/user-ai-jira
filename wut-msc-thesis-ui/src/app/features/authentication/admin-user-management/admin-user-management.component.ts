import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../../models/classes/user.model';
import { AdminApiService, AdminCreateUserPayload, AdminSite } from '../../../services/admin/admin-api.service';
import { UserService } from '../../../services/user/user.service';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css']
})
export class AdminUserManagementComponent implements OnInit {
  activeSection: 'create' | 'list' | 'assign' = 'create';
  users: User[] = [];
  sites: AdminSite[] = [];
  assignedSitesByUsername: AdminSite[] = [];
  isLoading = false;
  isLoadingSites = false;
  isSaving = false;
  isAssigning = false;
  isLoadingAssignedSites = false;
  editingUserId: number | null = null;
  saveError = '';
  saveMessage = '';
  assignedSitesMessage = '';

  readonly roleOptions = ['ADMIN', 'USER', 'TESTER', 'MANAGER'];

  usernameLookup = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });

  assignmentForm = new FormGroup({
    userId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    siteId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    defaultForUser: new FormControl<boolean>(true, { nonNullable: true })
  });

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
    this.loadSites();
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
    this.activeSection = 'create';
    this.editingUserId = user.id;
    this.saveMessage = '';
    this.saveError = '';
    
    // Handle both old (userName, userEmail, userRole) and new (username, emailAddress, roles) field names
    const apiUser = user as any;
    const username = apiUser.username || user.userName || '';
    const email = apiUser.emailAddress || user.userEmail || '';
    const roles = apiUser.roles || user.userRole || ['USER'];
    
    this.userForm.patchValue({
      username: username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      emailAddress: email,
      phoneNumber: user.phoneNumber || '',
      password: '',
      roles: Array.isArray(roles) ? roles : ['USER']
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
      ? this.userService.updateUser(this.editingUserId, payload as any)
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

  getUsername(user: User): string {
    const apiUser = user as any;
    return apiUser.username || user.userName || '-';
  }

  getRoles(user: User): string[] | string {
    const apiUser = user as any;
    return apiUser.roles || user.userRole || ['USER'];
  }

  isActive(user: User): boolean {
    const apiUser = user as any;
    return apiUser.active || user.active || false;
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

  setSection(section: 'create' | 'list' | 'assign'): void {
    this.activeSection = section;
    this.saveMessage = '';
    this.saveError = '';
    if (section === 'list') {
      this.refreshUsers();
    }
    if (section === 'assign') {
      this.loadSites();
    }
  }

  loadSites(): void {
    this.isLoadingSites = true;
    this.adminApiService.getSites().subscribe({
      next: (sites) => {
        this.sites = sites || [];
        this.isLoadingSites = false;
      },
      error: (error) => {
        this.isLoadingSites = false;
        this.saveError = error?.error?.message || 'Unable to load sites.';
      }
    });
  }

  assignSite(): void {
    this.saveMessage = '';
    this.saveError = '';

    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    const { userId, siteId, defaultForUser } = this.assignmentForm.getRawValue();
    if (!userId || !siteId) {
      this.saveError = 'User and site are required.';
      return;
    }

    this.isAssigning = true;
    this.adminApiService.assignSite(siteId, { userId, defaultForUser }).subscribe({
      next: () => {
        this.isAssigning = false;
        this.saveMessage = 'Site assigned successfully.';
        const username = this.usernameLookup.value.trim();
        if (username) {
          this.fetchAssignedSitesByUsername();
        }
      },
      error: (error) => {
        this.isAssigning = false;
        this.saveError = error?.error?.message || 'Could not assign site to user.';
      }
    });
  }

  fillUsernameFromSelectedUser(): void {
    const selectedUserId = this.assignmentForm.controls.userId.value;
    if (!selectedUserId) {
      return;
    }

    const selectedUser = this.users.find((u) => u.id === selectedUserId);
    const username = (selectedUser as any)?.username || selectedUser?.userName || '';
    this.usernameLookup.setValue(username);
  }

  fetchAssignedSitesByUsername(): void {
    this.assignedSitesMessage = '';
    this.saveError = '';

    if (this.usernameLookup.invalid) {
      this.usernameLookup.markAsTouched();
      return;
    }

    const username = this.usernameLookup.value.trim();
    if (!username) {
      this.usernameLookup.markAsTouched();
      return;
    }

    this.isLoadingAssignedSites = true;
    this.adminApiService.getSitesByUsername(username).subscribe({
      next: (sites) => {
        this.assignedSitesByUsername = sites || [];
        this.assignedSitesMessage = this.assignedSitesByUsername.length
          ? `Found ${this.assignedSitesByUsername.length} assigned site(s) for ${username}.`
          : `No assigned sites found for ${username}.`;
        this.isLoadingAssignedSites = false;
      },
      error: (error) => {
        this.assignedSitesByUsername = [];
        this.assignedSitesMessage = '';
        this.saveError = error?.error?.message || 'Could not fetch assigned sites.';
        this.isLoadingAssignedSites = false;
      }
    });
  }
}
