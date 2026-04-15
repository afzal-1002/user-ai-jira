import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService, AdminSite } from '../../../services/admin/admin-api.service';
import { User } from '../../../models/classes/user.model';
import { UserService } from '../../../services/user/user.service';

@Component({
  selector: 'app-admin-site-assignment',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './admin-site-assignment.component.html',
  styleUrls: ['./admin-site-assignment.component.css']
})
export class AdminSiteAssignmentComponent implements OnInit {
  users: User[] = [];
  sites: AdminSite[] = [];
  assignedSitesByUsername: AdminSite[] = [];
  isLoading = false;
  isAssigning = false;
  isLoadingAssignedSites = false;
  successMessage = '';
  errorMessage = '';
  assignedSitesMessage = '';

  usernameLookup = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });

  assignmentForm = new FormGroup({
    userId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    siteId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    defaultForUser: new FormControl<boolean>(true, { nonNullable: true })
  });

  constructor(
    private userService: UserService,
    private adminApiService: AdminApiService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users || [];
        this.adminApiService.getSites().subscribe({
          next: (sites) => {
            this.sites = sites || [];
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  assignSite(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.assignmentForm.invalid) {
      this.assignmentForm.markAllAsTouched();
      return;
    }

    const { userId, siteId, defaultForUser } = this.assignmentForm.getRawValue();
    if (!userId || !siteId) {
      this.errorMessage = 'User and site are required.';
      return;
    }

    this.isAssigning = true;

    this.adminApiService.assignSite(siteId, { userId, defaultForUser }).subscribe({
      next: () => {
        this.isAssigning = false;
        this.successMessage = 'Site assigned successfully.';
        const username = this.usernameLookup.value.trim();
        if (username) {
          this.fetchAssignedSitesByUsername();
        }
      },
      error: (error) => {
        this.isAssigning = false;
        this.errorMessage = error?.error?.message || 'Could not assign site to user.';
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
    this.errorMessage = '';

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
        this.errorMessage = error?.error?.message || 'Could not fetch assigned sites by username.';
        this.isLoadingAssignedSites = false;
      }
    });
  }
}
