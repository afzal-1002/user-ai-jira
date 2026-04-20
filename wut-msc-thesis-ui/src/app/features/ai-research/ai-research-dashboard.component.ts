import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-ai-research-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './ai-research-dashboard.component.html',
  styleUrls: ['./ai-research-dashboard.component.css']
})
export class AiResearchDashboardComponent {}
