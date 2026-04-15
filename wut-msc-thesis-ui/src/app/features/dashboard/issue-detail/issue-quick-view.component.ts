import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-issue-quick-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="issue-quick-view" style="padding:24px">
      <button class="btn btn-secondary" routerLink="/issues/{{ projectKey || '' }}">← Back</button>
      <h2 style="margin-top:16px">Issue Quick View</h2>
      <p><strong>Issue Key:</strong> {{ issueKey }}</p>
    </div>
  `
})
export class IssueQuickViewComponent {
  issueKey: string | null = null;
  projectKey: string | null = null;

  constructor(private route: ActivatedRoute) {
    // Prefer navigation state if caller passed the full issue object
    const navState: any = history.state || {};
    if (navState?.issue) {
      // caller passed an `issue` object via navigation state
      this.issueKey = navState.issue.key || String(navState.issue.id || navState.issueKey || null);
    }

    this.route.params.subscribe((p: any) => {
      const raw = p['issueKey'];
      if (!this.issueKey) {
        // Normalize: if route param is an object (rare), extract `.key`
        if (raw && typeof raw === 'object') {
          this.issueKey = raw.key || String(raw.id || JSON.stringify(raw));
        } else {
          this.issueKey = raw != null ? String(raw) : null;
        }
      }

      // also try to read optional project key from query params
      this.route.queryParams.subscribe(q => {
        this.projectKey = q['projectKey'] || null;
      });

      console.log('🔎 IssueQuickViewComponent initialized for', this.issueKey, 'navStatePresent=', !!navState?.issue);
    });
  }
}
