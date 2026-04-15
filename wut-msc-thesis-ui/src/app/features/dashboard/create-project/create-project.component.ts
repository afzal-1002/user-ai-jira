import { Component, OnInit } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { McpFrontendService } from '../../../services/mcp/mcp-frontend.service';
import { JiraProjectResponse, UpdateProjectRequest } from '../../../models/interface/mcp-server.interface';

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
    private mcpFrontendService: McpFrontendService
  ) {}

  createdProject: JiraProjectResponse | null = null;
  isLoading = false;
  projectError = '';
  projectSuccess = '';

  isEditMode = false;
  originalProjectKey: string | null = null;
  originalProjectId: number | string | null = null;

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
        this.mcpFrontendService.getProjectDetails(key, 'jira').subscribe({
          next: (project: JiraProjectResponse) => {
            this.patchFormFromProject(project);
          },
          error: (err: any) => {
            console.error('Failed to load project for edit', err);
            this.projectError = err?.error?.message || err?.message || 'Failed to load project details.';
          }
        });
      }
    }
  }

  private patchFormFromProject(project: JiraProjectResponse): void {
    const legacyProject = project as any;
    this.originalProjectId = project.id ?? null;
    this.projectForm.patchValue({
      key: project.key || '',
      projectName: project.name || legacyProject.projectName || '',
      description: project.description || '',
      projectTypeKey: project.projectTypeKey || legacyProject.projectType?.key || 'software',
      projectTemplateKey: project.projectTemplateKey || '',
      leadAccountId: project.lead?.accountId || legacyProject.leadAccountId || '',
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

    const payload: UpdateProjectRequest = {
      projectName: projectData.projectName || '',
      projectTypeKey: projectData.projectTypeKey || 'software',
      description: projectData.description || '',
      leadAccountId: projectData.leadAccountId || ''
    };

    if (this.isEditMode && this.originalProjectKey && this.originalProjectId) {
      console.log('📤 Sending project update data:', payload);
      this.mcpFrontendService.updateProject(this.originalProjectId, payload).subscribe({
        next: (response: JiraProjectResponse) => {
          this.isLoading = false;
          console.log('✅ Project updated successfully:', response);
          this.projectSuccess = `Project '${response.name || payload.projectName}' updated successfully!`;

          setTimeout(() => {
            this.router.navigate(['/mcp/projects']);
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

    this.isLoading = false;
    this.projectError = 'Project creation is not supported in MCP server flow. Use an existing Jira project and edit it if needed.';
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
