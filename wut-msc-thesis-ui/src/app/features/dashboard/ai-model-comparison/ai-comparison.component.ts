import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { Router } from '@angular/router';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, ChartOptions, ChartType } from 'chart.js';
import { AiOverallComparisonComponent } from './overall-comparison/ai-overall-comparison.component';
import { AiPerformanceComparisonComponent } from './performance/ai-performance-comparison.component';
import { AiEstimationComparisonComponent } from './estimation/ai-estimation-comparison.component';
import { AiStabilityComparisonComponent } from './stability/ai-stability-comparison.component';
import { AiContentComparisonComponent } from './content/ai-content-comparison.component';
import { AiSummaryComparisonComponent } from './summary/ai-summary-comparison.component';
import { AiEvalBugModelComparisonComponent } from '../ai-evaluation/model-comparison/ai-eval-bug-model-comparison.component';
import { AuthService } from '../../../services/auth/auth.service';

if (typeof window !== 'undefined') {
  Chart.register(ChartDataLabels);
}

@Component({
  selector: 'app-ai-comparison',
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule,
    AiOverallComparisonComponent,
    AiPerformanceComparisonComponent,
    AiEstimationComparisonComponent,
    AiStabilityComparisonComponent,
    AiContentComparisonComponent,
    AiSummaryComparisonComponent,
    AiEvalBugModelComparisonComponent
  ],
  templateUrl: './ai-comparison.component.html',
  styleUrls: ['./ai-comparison.component.css']
})
export class AiComparisonComponent {
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  activeTab: 'overall' | 'performance' | 'estimation' | 'stability' | 'content' | 'summary' = 'overall';

  constructor(private router: Router, private authService: AuthService) {}
  

  ngOnInit(): void {
    this.selectTab('overall');
  }

  selectTab(tab: 'overall' | 'performance' | 'estimation' | 'stability' | 'content' | 'summary'): void {
    this.activeTab = tab;
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
