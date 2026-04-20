import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { McpAssignedSite, McpFrontendContext, McpProjectSource } from './mcp-frontend.service';
import { UserSessionService } from '../user-session/user-session.service';

const SELECTED_SITE_ID = 'selectedSiteId';
const SELECTED_SITE_HOST_PART = 'selectedSiteHostPart';
const SELECTED_SITE_NAME = 'selectedSiteName';
const SELECTED_PROJECT_KEY = 'selectedProjectKey';
const SELECTED_ISSUE_KEY = 'selectedIssueKey';

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

  get selectedHostPart(): string | null {
    const selected = this.selectedSiteSubject.value;
    if (selected?.hostPart) {
      return selected.hostPart;
    }

    return this.sessionService.getItem<string>(SELECTED_SITE_HOST_PART) || null;
  }

  get selectedSiteId(): number | null {
    const selected = this.selectedSiteSubject.value;
    if (selected?.id) {
      return selected.id;
    }

    return this.sessionService.getItem<number>(SELECTED_SITE_ID);
  }

  get selectedProjectKey(): string {
    return this.sessionService.getItem<string>(SELECTED_PROJECT_KEY) || '';
  }

  get selectedIssueKey(): string {
    return this.sessionService.getItem<string>(SELECTED_ISSUE_KEY) || '';
  }

  constructor(private sessionService: UserSessionService) {
    const persistedSiteId = this.sessionService.getItem<number>(SELECTED_SITE_ID);
    const persistedHostPart = this.sessionService.getItem<string>(SELECTED_SITE_HOST_PART) || '';
    const persistedSiteName = this.sessionService.getItem<string>(SELECTED_SITE_NAME) || '';

    if (persistedSiteId) {
      this.selectedSiteSubject.next({ id: persistedSiteId, siteName: persistedSiteName, hostPart: persistedHostPart });
    }
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
    if (existing) {
      const matchedSite = sites.find((s) => s.id === existing.id);
      if (matchedSite) {
        this.selectedSiteSubject.next(matchedSite);
        this.persistSelectedSite(matchedSite);
        return;
      }
    }

    const preferred = sites.find((s) => s.defaultForUser) || sites[0];
    this.selectedSiteSubject.next(preferred);
    this.persistSelectedSite(preferred);
  }

  setSites(sites: McpAssignedSite[]): void {
    this.assignedSitesSubject.next(sites);

    const existing = this.selectedSiteSubject.value;
    if (existing) {
      const matchedSite = sites.find((s) => s.id === existing.id);
      if (matchedSite) {
        this.selectedSiteSubject.next(matchedSite);
        this.persistSelectedSite(matchedSite);
        return;
      }
    }

    const nextSite = sites.find((s) => s.defaultForUser) || sites[0] || null;
    this.selectedSiteSubject.next(nextSite);
    this.persistSelectedSite(nextSite);
  }

  selectSiteById(siteId: number): void {
    const site = this.assignedSitesSubject.value.find((s) => s.id === siteId) || null;
    this.selectedSiteSubject.next(site);
    this.persistSelectedSite(site);
  }

  setSelectedSource(source: McpProjectSource): void {
    this.selectedSourceSubject.next(source);
  }

  clear(): void {
    this.contextSubject.next(null);
    this.assignedSitesSubject.next([]);
    this.selectedSiteSubject.next(null);
    this.selectedSourceSubject.next('jira');
    this.persistSelectedSite(null);
    this.sessionService.removeItem(SELECTED_PROJECT_KEY);
    this.sessionService.removeItem(SELECTED_ISSUE_KEY);
  }

  setSelectedProjectKey(projectKey: string | null | undefined): void {
    const normalized = String(projectKey || '').trim();
    if (!normalized) {
      this.sessionService.removeItem(SELECTED_PROJECT_KEY);
      return;
    }

    this.sessionService.setItem(SELECTED_PROJECT_KEY, normalized);
  }

  setSelectedIssueKey(issueKey: string | null | undefined): void {
    const normalized = String(issueKey || '').trim();
    if (!normalized) {
      this.sessionService.removeItem(SELECTED_ISSUE_KEY);
      return;
    }

    this.sessionService.setItem(SELECTED_ISSUE_KEY, normalized);
  }

  private persistSelectedSite(site: McpAssignedSite | null): void {
    if (!site?.id) {
      this.sessionService.removeItem(SELECTED_SITE_ID);
      this.sessionService.removeItem(SELECTED_SITE_HOST_PART);
      this.sessionService.removeItem(SELECTED_SITE_NAME);
      return;
    }

    this.sessionService.setItem(SELECTED_SITE_ID, site.id);
    this.sessionService.setItem(SELECTED_SITE_HOST_PART, site.hostPart || '');
    this.sessionService.setItem(SELECTED_SITE_NAME, site.siteName || '');
  }
}
