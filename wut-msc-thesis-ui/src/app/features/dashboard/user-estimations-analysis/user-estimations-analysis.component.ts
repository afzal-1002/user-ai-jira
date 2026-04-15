import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-user-estimations-analysis',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './user-estimations-analysis.component.html',
  styleUrl: './user-estimations-analysis.component.css'
})
export class UserEstimationsAnalysisComponent {
  constructor(private authService: AuthService) {}

  get currentUserId(): number | string | null {
    return this.authService.currentUser?.id ?? null;
  }
}
