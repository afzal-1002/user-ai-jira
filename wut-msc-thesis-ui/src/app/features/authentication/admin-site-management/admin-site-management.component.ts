import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
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
  isFiltering = false;
  deletingSiteId: number | null = null;
  editingSiteId: number | null = null;
  errorMessage = '';
  successMessage = '';
  filterMessage = '';
  sites: AdminSite[] = [];

  siteForm = new FormGroup({
    siteName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    hostPart: new FormControl<string>('', { nonNullable: true }),
    baseUrl: new FormControl<string>('', { nonNullable: true }),
    username: new FormControl<string>('', { nonNullable: true }),
    jiraToken: new FormControl<string>('', { nonNullable: true })
  });

  usernameFilter = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });

  constructor(private adminApiService: AdminApiService) {}

  ngOnInit(): void {
    this.loadSites();
  }

  loadSites(): void {
    this.isLoading = true;
    this.filterMessage = '';
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

  filterSitesByUsername(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.filterMessage = '';

    if (this.usernameFilter.invalid) {
      this.usernameFilter.markAsTouched();
      return;
    }

    const username = this.usernameFilter.value.trim();
    if (!username) {
      this.usernameFilter.markAsTouched();
      return;
    }

    this.isFiltering = true;
    this.adminApiService.getSitesByUsername(username).subscribe({
      next: (sites) => {
        this.sites = sites || [];
        this.filterMessage = this.sites.length
          ? `Showing ${this.sites.length} assigned site(s) for ${username}.`
          : `No assigned sites found for ${username}.`;
        this.isFiltering = false;
      },
      error: (error) => {
        this.isFiltering = false;
        this.sites = [];
        this.errorMessage = error?.error?.message || 'Could not filter sites by username.';
      }
    });
  }

  clearSiteFilter(): void {
    this.usernameFilter.setValue('');
    this.filterMessage = '';
    this.loadSites();
  }

  getDisplayBaseUrl(site: AdminSite): string {
    const direct = String(site.baseURL || site.baseUrl || '').trim();
    if (direct) {
      return direct;
    }

    const host = String(site.hostPart || '').trim();
    if (host) {
      return `https://${host}.atlassian.net/`;
    }

    return '-';
  }

  startEditSite(site: AdminSite): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.editingSiteId = site.id;

    this.siteForm.patchValue({
      siteName: site.siteName || '',
      hostPart: String(site.hostPart || '').trim(),
      baseUrl: this.getDisplayBaseUrl(site) === '-' ? '' : this.getDisplayBaseUrl(site),
      username: this.siteForm.controls.username.value,
      jiraToken: ''
    });
  }

  cancelEditSite(): void {
    this.editingSiteId = null;
    this.siteForm.reset({
      siteName: '',
      hostPart: '',
      baseUrl: '',
      username: '',
      jiraToken: ''
    });
  }

  deleteSite(site: AdminSite): void {
    if (!site.id) {
      return;
    }

    this.deletingSiteId = site.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminApiService.deleteSiteById(site.id).subscribe({
      next: () => {
        this.deletingSiteId = null;
        this.successMessage = 'Site deleted successfully.';
        if (this.editingSiteId === site.id) {
          this.cancelEditSite();
        }
        this.loadSites();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingSiteId = null;
        this.errorMessage = error?.error?.message || 'Could not delete site.';
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

    if (!this.editingSiteId && (!payload.username || !payload.jiraToken)) {
      this.errorMessage = 'Username and Jira Token are required when creating a site.';
      return;
    }

    if (this.editingSiteId) {
      const site = this.sites.find((s) => s.id === this.editingSiteId);
      if (!site) {
        this.errorMessage = 'Selected site not found.';
        return;
      }

      const nextName = String(payload.siteName || '').trim();
      const nextBaseUrl = String(payload.baseUrl || '').trim();
      const currentName = String(site.siteName || '').trim();
      const currentBaseUrl = String(site.baseURL || site.baseUrl || '').trim();

      const updateName$ = nextName !== currentName
        ? this.adminApiService.updateSiteName(site.id, nextName)
        : of(null);

      const updateUrl$ = nextBaseUrl !== currentBaseUrl && !!nextBaseUrl
        ? this.adminApiService.updateSiteUrl(site.id, nextBaseUrl)
        : of(null);

      this.isSaving = true;
      forkJoin([updateName$, updateUrl$]).subscribe({
        next: () => {
          this.isSaving = false;
          this.successMessage = 'Site updated successfully.';
          this.cancelEditSite();
          this.loadSites();
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving = false;
          this.errorMessage = error?.error?.message || 'Could not update site.';
        }
      });
      return;
    }

    this.isSaving = true;
    this.adminApiService.createSite(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Jira site connection created successfully.';
        this.siteForm.reset({
          siteName: '',
          hostPart: '',
          baseUrl: '',
          username: '',
          jiraToken: ''
        });
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
