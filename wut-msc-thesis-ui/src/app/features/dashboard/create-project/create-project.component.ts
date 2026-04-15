import { Component, OnInit } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../../services/project/project.service';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [NgIf, RouterLink, ReactiveFormsModule, NgClass],
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})
export class CreateProjectComponent implements OnInit {
  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  createdProject: any = null;
  isLoading = false;
  projectError = '';
  projectSuccess = '';

  isEditMode = false;
  originalProjectKey: string | null = null;

  projectForm = new FormGroup({
    key: new FormControl('', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]),
    projectName: new FormControl('', Validators.required),
    projectTypeKey: new FormControl('software', Validators.required),
    projectTemplateKey: new FormControl('com.pyxis.greenhopper.jira:gh-simplified-scrum-classic', Validators.required),
    description: new FormControl('', Validators.required),
    leadAccountId: new FormControl('', Validators.required),
    assigneeType: new FormControl('PROJECT_LEAD', Validators.required)
  });

  ngOnInit(): void {
    const key = this.route.snapshot.paramMap.get('key');
    if (key) {
      this.isEditMode = true;
      this.originalProjectKey = key;

      const state: any = history.state;
      if (state?.project && state.project.key === key) {
        this.patchFormFromProject(state.project);
      } else {
        // Fallback: load projects for current user and find matching key
        const user = this.authService.currentUser;
        if (user && user.baseUrl) {
          this.projectService.getProjectsByBaseUrl(user.baseUrl).subscribe({
            next: (projects: any[]) => {
              const proj = (projects || []).find(p => p.key === key);
              if (proj) {
                this.patchFormFromProject(proj);
              }
            },
            error: (err: any) => {
              console.error('Failed to load project for edit', err);
            }
          });
        }
      }
    }
  }

  private patchFormFromProject(project: any): void {
    this.projectForm.patchValue({
      key: project.key || '',
      projectName: project.name || project.projectName || '',
      description: project.description || '',
      projectTypeKey: project.projectTypeKey || project.projectType?.key || 'software',
      projectTemplateKey: project.projectTemplateKey || '',
      leadAccountId: project.lead?.accountId || project.leadAccountId || '',
      assigneeType: project.assigneeType || 'PROJECT_LEAD'
    });
  }

  createProject() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      console.log('Form Valid:', this.projectForm.valid);
      console.log('Form Data:', this.projectForm.value);
      return;
    }

    this.isLoading = true;
    this.projectError = '';
    this.projectSuccess = '';

    const projectData = this.projectForm.value;

    const payload = {
      key: projectData.key || '',
      projectName: projectData.projectName || '',
      projectTypeKey: projectData.projectTypeKey || 'software',
      projectTemplateKey: projectData.projectTemplateKey || 'com.pyxis.greenhopper.jira:gh-simplified-scrum-classic',
      description: projectData.description || '',
      leadAccountId: projectData.leadAccountId || '',
      assigneeType: projectData.assigneeType || 'PROJECT_LEAD'
    };

    if (this.isEditMode && this.originalProjectKey) {
      console.log('📤 Sending project update data:', payload);
      this.projectService.updateProject(this.originalProjectKey, payload as any).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('✅ Project updated successfully:', response);
          this.projectSuccess = `Project '${response.projectName || payload.projectName}' updated successfully!`;

          setTimeout(() => {
            this.router.navigate(['/projects']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Project update failed:', error);
          let errorMessage = 'Project update failed. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.error) {
            errorMessage = error.error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          this.projectError = errorMessage;
        }
      });
      return;
    }

    console.log('📤 Sending project creation data:', payload);

    this.projectService.createProject(payload as any).subscribe(
      (response: any) => {
        this.isLoading = false;
        console.log('✅ Project created successfully:', response);

        this.createdProject = response;
        this.projectSuccess = `Project '${response.projectName || projectData.projectName}' created successfully!`;
        this.projectForm.reset();
        this.projectForm.patchValue({
          projectTypeKey: 'software',
          projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-simplified-scrum-classic',
          assigneeType: 'PROJECT_LEAD'
        });

        setTimeout(() => {
          this.router.navigate(['/projects']);
        }, 2000);
      },
      (error) => {
        this.isLoading = false;
        console.error('❌ Project creation failed:', error);
        console.error('Error status:', error.status);
        console.error('Error details:', error.error);

        let errorMessage = 'Project creation failed. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.projectError = errorMessage;
      }
    );
  }

  getValidationClass(controlName: string) {
    const control = this.projectForm.get(controlName);
    if (!control) return '';
    if (control.invalid && (control.touched || control.dirty)) return 'is-invalid';
    if (control.valid && (control.touched || control.dirty)) return 'is-valid';
    return '';
  }

  // Getter methods for form controls
  get key() {
    return this.projectForm.get('key');
  }

  get projectName() {
    return this.projectForm.get('projectName');
  }

  get projectTypeKey() {
    return this.projectForm.get('projectTypeKey');
  }

  get projectTemplateKey() {
    return this.projectForm.get('projectTemplateKey');
  }

  get description() {
    return this.projectForm.get('description');
  }

  get leadAccountId() {
    return this.projectForm.get('leadAccountId');
  }

  get assigneeType() {
    return this.projectForm.get('assigneeType');
  }
}
