import { NgIf, NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SiteService, SiteCreatePayload, SiteResponse } from '../../../services/site/site.service';
import { AuthService } from '../../../services/auth/auth.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-admin-jira-config',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-jira-config.component.html',
  styleUrls: ['./admin-jira-config.component.css']
})
export class AdminJiraConfigComponent implements OnInit {
  sites: SiteResponse[] = [];
  isLoading = false;
  isSaving = false;
  isLoadingSites = false;
  isUpdatingSite = false;
  deletingSiteId: number | null = null;
  editingSiteId: number | null = null;
  saveMessage = '';
  errorMessage = '';
  loadError = '';

  configForm = new FormGroup({
    siteName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    hostPart: new FormControl<string>('', { nonNullable: true }),
    baseUrl: new FormControl<string>('', { nonNullable: true }),
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    jiraToken: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] })
  });

  editSiteForm = new FormGroup({
    siteName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    baseUrl: new FormControl<string>('', { nonNullable: true })
  });

  constructor(
    private siteService: SiteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    console.log('Current User:', user);
    this.loadSites();
  }

  loadSites(): void {
    this.isLoadingSites = true;
    this.loadError = '';
    console.log('Loading sites from: GET /api/wut/sites (admin)');
    
    this.siteService.getAllSites().subscribe({
      next: (sites) => {
        console.log('Sites loaded successfully:', sites);
        console.log('Total sites:', sites?.length || 0);
        this.sites = sites || [];
        this.isLoadingSites = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading sites:', error);
        console.error('Status:', error?.status);
        console.error('StatusText:', error?.statusText);
        console.error('Message:', error?.error?.message || error?.message);
        console.error('Full error:', error?.error);
        
        this.loadError = `Error ${error?.status}: ${error?.statusText || 'Unknown'} - ${error?.error?.message || 'Check backend logs. This endpoint is admin-only.'}`;
        this.sites = [];
        this.isLoadingSites = false;
      }
    });
  }

  refreshSites(): void {
    this.loadSites();
  }

  getDisplayBaseUrl(site: SiteResponse): string {
    const direct = (site.baseURL || site.baseUrl || '').trim();
    if (direct) {
      return direct;
    }

    if (site.hostPart) {
      return `https://${site.hostPart}.atlassian.net/`;
    }

    return '-';
  }

  startEditSite(site: SiteResponse): void {
    this.errorMessage = '';
    this.saveMessage = '';
    this.editingSiteId = site.id;
    this.editSiteForm.setValue({
      siteName: site.siteName || '',
      baseUrl: (site.baseURL || site.baseUrl || '').trim()
    });
  }

  cancelEditSite(): void {
    this.editingSiteId = null;
    this.editSiteForm.reset({
      siteName: '',
      baseUrl: ''
    });
  }

  saveSiteEdit(site: SiteResponse): void {
    if (!site.id || this.editSiteForm.invalid) {
      this.editSiteForm.markAllAsTouched();
      return;
    }

    const nextName = this.editSiteForm.controls.siteName.value.trim();
    const nextBaseUrl = this.editSiteForm.controls.baseUrl.value.trim();
    const currentName = (site.siteName || '').trim();
    const currentBaseUrl = (site.baseURL || site.baseUrl || '').trim();

    const updateName$ = nextName !== currentName
      ? this.siteService.updateSiteName(site.id, nextName)
      : of(null);

    const updateUrl$ = nextBaseUrl !== currentBaseUrl && !!nextBaseUrl
      ? this.siteService.updateSiteUrl(site.id, nextBaseUrl)
      : of(null);

    this.isUpdatingSite = true;
    this.errorMessage = '';
    this.saveMessage = '';

    forkJoin([updateName$, updateUrl$]).subscribe({
      next: () => {
        this.isUpdatingSite = false;
        this.saveMessage = 'Site updated successfully.';
        this.cancelEditSite();
        this.loadSites();
      },
      error: (error: HttpErrorResponse) => {
        this.isUpdatingSite = false;
        this.errorMessage = error?.error?.message || 'Could not update site.';
      }
    });
  }

  deleteSite(site: SiteResponse): void {
    if (!site.id) {
      return;
    }

    this.deletingSiteId = site.id;
    this.errorMessage = '';
    this.saveMessage = '';

    this.siteService.deleteSite(site.id).subscribe({
      next: () => {
        this.deletingSiteId = null;
        this.saveMessage = 'Site deleted successfully.';
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

  saveConfig(): void {
    this.saveMessage = '';
    this.errorMessage = '';

    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    const payload: SiteCreatePayload = this.configForm.getRawValue() as SiteCreatePayload;
    this.isSaving = true;

    this.siteService.createSite(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveMessage = 'Jira site connection saved successfully.';
        this.configForm.controls.jiraToken.setValue('');
        this.loadSites();
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.message || 'Could not save Jira site configuration.';
      }
    });
  }
}
