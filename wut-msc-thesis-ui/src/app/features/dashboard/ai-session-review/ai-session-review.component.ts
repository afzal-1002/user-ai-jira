import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BranchSession } from '../../../models/interface/ai-session-workflow.interface';
import { AiSessionWorkflowService } from '../../../services/ai/ai-session-workflow.service';

@Component({
  selector: 'app-ai-session-review',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ai-session-review.component.html',
  styleUrls: ['./ai-session-review.component.css']
})
export class AiSessionReviewComponent implements OnInit {
  sessionId = '';
  session: BranchSession | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private aiSessionWorkflowService: AiSessionWorkflowService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.sessionId = String(params.get('sessionId') || '').trim();
      this.loadReview();
    });
  }

  goBackToWorkspace(): void {
    if (!this.sessionId) {
      return;
    }

    this.router.navigate(['/ai/sessions', this.sessionId]);
  }

  private loadReview(): void {
    if (!this.sessionId) {
      this.errorMessage = 'Missing session id.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.aiSessionWorkflowService.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session = session;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = String(error?.error?.message || error?.message || 'Failed to load review result.');
      }
    });
  }
}
