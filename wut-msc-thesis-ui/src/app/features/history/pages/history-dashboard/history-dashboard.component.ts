import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { EstimationHistoryComponent } from '../estimation-history/estimation-history.component';
import { AccuracyTrendComponent } from '../accuracy-trend/accuracy-trend.component';
import { ModelComparisonComponent } from '../model-comparison/model-comparison.component';
import { ExplainabilityImpactComponent } from '../explainability-impact/explainability-impact.component';
import { HumanInLoopComponent } from '../human-in-loop/human-in-loop.component';
import { StabilityVarianceComponent } from '../stability-variance/stability-variance.component';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-history-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    EstimationHistoryComponent,
    AccuracyTrendComponent,
    ModelComparisonComponent,
    ExplainabilityImpactComponent,
    HumanInLoopComponent,
    StabilityVarianceComponent
  ],
  templateUrl: './history-dashboard.component.html',
  styleUrls: ['./history-dashboard.component.scss']
})
export class HistoryDashboardComponent {
  activeView:
    | 'history'
    | 'accuracy'
    | 'comparison'
    | 'explainability'
    | 'human'
    | 'stability' = 'history';

  constructor(private router: Router, private authService: AuthService) {}

  setActive(view: typeof this.activeView): void {
    this.activeView = view;
  }

  goBackToDashboard(): void {
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
