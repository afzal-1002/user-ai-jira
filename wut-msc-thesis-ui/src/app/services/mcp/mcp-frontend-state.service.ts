import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { McpAssignedSite, McpFrontendContext, McpProjectSource } from './mcp-frontend.service';

@Injectable({
  providedIn: 'root'
})
export class McpFrontendStateService {
  private contextSubject = new BehaviorSubject<McpFrontendContext | null>(null);
  private assignedSitesSubject = new BehaviorSubject<McpAssignedSite[]>([]);
  private selectedSiteSubject = new BehaviorSubject<McpAssignedSite | null>(null);
  private selectedSourceSubject = new BehaviorSubject<McpProjectSource>('jira');

  context$ = this.contextSubject.asObservable();
  assignedSites$ = this.assignedSitesSubject.asObservable();
  selectedSite$ = this.selectedSiteSubject.asObservable();
  selectedSource$ = this.selectedSourceSubject.asObservable();

  get selectedSite(): McpAssignedSite | null {
    return this.selectedSiteSubject.value;
  }

  setContext(context: McpFrontendContext): void {
    this.contextSubject.next(context);
    const sites = context?.sites || [];
    this.assignedSitesSubject.next(sites);

    if (!sites.length) {
      this.selectedSiteSubject.next(null);
      return;
    }

    const existing = this.selectedSiteSubject.value;
    if (existing && sites.some((s) => s.id === existing.id)) {
      return;
    }

    const preferred = sites.find((s) => s.defaultForUser) || sites[0];
    this.selectedSiteSubject.next(preferred);
  }

  setSites(sites: McpAssignedSite[]): void {
    this.assignedSitesSubject.next(sites);

    const existing = this.selectedSiteSubject.value;
    if (existing && sites.some((s) => s.id === existing.id)) {
      return;
    }

    this.selectedSiteSubject.next(sites.find((s) => s.defaultForUser) || sites[0] || null);
  }

  selectSiteById(siteId: number): void {
    const site = this.assignedSitesSubject.value.find((s) => s.id === siteId) || null;
    this.selectedSiteSubject.next(site);
  }

  setSelectedSource(source: McpProjectSource): void {
    this.selectedSourceSubject.next(source);
  }

  clear(): void {
    this.contextSubject.next(null);
    this.assignedSitesSubject.next([]);
    this.selectedSiteSubject.next(null);
    this.selectedSourceSubject.next('jira');
  }
}
