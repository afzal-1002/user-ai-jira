import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AiResponseTimingComponent } from './ai-response-timing.component';

@Component({
  selector: 'app-ai-response-evaluation',
  standalone: true,
  imports: [CommonModule, AiResponseTimingComponent],
  templateUrl: './ai-response-evaluation.component.html',
  styleUrls: ['./ai-response-evaluation.component.css']
})
export class AiResponseEvaluationComponent {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/ai-estimations']);
  }
}
