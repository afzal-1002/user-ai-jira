import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService, AdminCreateSitePayload, AdminSite } from '../../../services/admin/admin-api.service';

@Component({
  selector: 'app-admin-site-management',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './admin-site-management.component.html',
  styleUrls: ['./admin-site-management.component.css']
})
export class AdminSiteManagementComponent implements OnInit {
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  sites: AdminSite[] = [];

  siteForm = new FormGroup({
    siteName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    hostPart: new FormControl<string>('', { nonNullable: true }),
    baseUrl: new FormControl<string>('', { nonNullable: true }),
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    jiraToken: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(private adminApiService: AdminApiService) {}

  ngOnInit(): void {
    this.loadSites();
  }

  loadSites(): void {
    this.isLoading = true;
    this.adminApiService.getSites().subscribe({
      next: (sites) => {
        this.sites = sites || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  saveSite(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.siteForm.invalid) {
      this.siteForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();

    this.isSaving = true;
    this.adminApiService.createSite(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Jira site connection created successfully.';
        this.siteForm.controls.jiraToken.setValue('');
        this.loadSites();
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.message || 'Could not create Jira site connection.';
      }
    });
  }

  private buildPayload(): AdminCreateSitePayload {
    const { siteName, hostPart, baseUrl, username, jiraToken } = this.siteForm.getRawValue();

    return {
      siteName,
      hostPart: hostPart || undefined,
      baseUrl: baseUrl || undefined,
      username,
      jiraToken
    };
  }
}
