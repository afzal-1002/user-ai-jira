import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-ai-estimations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ai-estimations.component.html',
  styleUrls: ['./ai-estimations.component.css']
})
export class AiEstimationsComponent {
  constructor(private router: Router, private authService: AuthService) {}

  goToEvaluation(): void {
    this.router.navigate(['/ai-estimations/evaluation']);
  }

  goToMetrics(): void {
    this.router.navigate(['/ai-estimations/metrics']);
  }

  goToComparison(): void {
    this.router.navigate(['/ai-estimations/comparison']);
  }

  goBackToDashboard(): void {
    const user = this.authService.currentUser;
    if (user && user.id != null) {
      // Navigate the same way as after login so we reach the Welcome dashboard
      this.router.navigate(['user-dashboard', user.id]);
    } else {
      // Fallback: go back in history (usually the dashboard), otherwise home
      if (window.history.length > 1) {
        window.history.back();
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}
