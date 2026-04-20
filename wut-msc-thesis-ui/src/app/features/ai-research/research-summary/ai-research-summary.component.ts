import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AiResearchEvaluationService } from '../../../services/ai/ai-research-evaluation.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-ai-research-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-research-summary.component.html',
  styleUrls: ['./ai-research-summary.component.css', '../research-shared.css']
})
export class AiResearchSummaryComponent {
  isLoading = false;
  error = '';
  result: any = null;

  constructor(
    private researchService: AiResearchEvaluationService,
    private router: Router,
    private authService: AuthService
  ) {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading = true;
    this.error = '';
    this.researchService.getResearchSummary().subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Research summary error', err);
        this.error = 'Failed to load research summary.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
  const user = this.authService.currentUser;
  if (user && user.id != null) {
    this.router.navigate(['user-dashboard', user.id]);
  } else if (window.history.length > 1) {
    window.history.back();
  } else {
    this.router.navigate(['/']);
  }
  }
}
