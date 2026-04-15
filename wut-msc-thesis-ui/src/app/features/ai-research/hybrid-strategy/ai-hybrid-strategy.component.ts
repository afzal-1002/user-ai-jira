import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AiResearchEvaluationService } from '../../../services/ai/ai-research-evaluation.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-ai-hybrid-strategy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-hybrid-strategy.component.html',
  styleUrls: ['./ai-hybrid-strategy.component.css', '../research-shared.css']
})
export class AiHybridStrategyComponent {
  isLoading = false;
  error = '';
  result: any = null;

  constructor(
    private researchService: AiResearchEvaluationService,
    private router: Router,
    private authService: AuthService
  ) {
    this.loadHybridStrategy();
  }

  loadHybridStrategy(): void {
    this.isLoading = true;
    this.error = '';
    this.researchService.getHybridStrategy().subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Hybrid strategy error', err);
        this.error = 'Failed to load hybrid strategy recommendation.';
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
