import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { JiraPlatformConfig, UserService } from '../../../services/user/user.service';

@Component({
  selector: 'app-admin-jira-config',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-jira-config.component.html',
  styleUrls: ['./admin-jira-config.component.css']
})
export class AdminJiraConfigComponent implements OnInit {
  isLoading = false;
  isSaving = false;
  saveMessage = '';
  errorMessage = '';

  configForm = new FormGroup({
    siteName: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    hostPart: new FormControl<string>('', { nonNullable: true }),
    baseUrl: new FormControl<string>('', { nonNullable: true }),
    username: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    jiraToken: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.isLoading = false;
  }

  saveConfig(): void {
    this.saveMessage = '';
    this.errorMessage = '';

    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    const payload: JiraPlatformConfig = this.configForm.getRawValue();
    this.isSaving = true;

    this.userService.createSite(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveMessage = 'Jira site connection saved successfully.';
        this.configForm.controls.jiraToken.setValue('');
      },
      error: (error) => {
        this.isSaving = false;
        this.errorMessage = error?.error?.message || 'Could not save Jira site configuration.';
      }
    });
  }
}
