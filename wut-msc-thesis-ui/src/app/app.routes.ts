import { Routes } from '@angular/router';
import { AboutComponent } from './shared/component/about/about.component';
import { HomeComponent } from './shared/component/home/home.component';
import { LoginComponent } from './features/authentication/login/login.component';
import { ContactComponent } from './shared/component/contact/contact.component';
import { NotFoundComponent } from './features/error/not-found/not-found.component';
import { UserDashboardComponent } from './features/dashboard/user-dashboard/user-dashboard.component';
import { AdminDashboardComponent } from './features/dashboard/admin-dashboard/admin-dashboard.component';
import { ResetPassowrdComponent } from './features/authentication/reset-passowrd/reset-passowrd.component';
import { UserProfileComponent } from './features/authentication/user-profile/user-profile.component';
import { UpdateProfileComponent } from './features/authentication/update-profile/update-profile.component';
import { CreateProjectComponent } from './features/dashboard/create-project/create-project.component';
import { ProjectsHomeComponent } from './features/dashboard/projects-home/projects-home.component';
import { ProjectDetailComponent } from './features/dashboard/project-detail/project-detail.component';
import { ViewProfileComponent } from './features/authentication/user-profile/view-profile.component';
import { AuthGuard } from './services/auth/auth.guard';
import { AdminGuard } from './services/auth/admin.guard';
import { IssuesHomeComponent } from './features/dashboard/issues-home/issues-home.component';
import { IssueDetailComponent } from './features/dashboard/issue-detail/issue-detail.component';
import { AiAnalysisPageComponent } from './features/dashboard/issue-detail/ai-analysis-page/ai-analysis-page.component';
import { AiEstimationsComponent } from './features/dashboard/ai-estimations/ai-estimations.component';
import { AiEvaluationComponent } from './features/dashboard/ai-evaluation/ai-evaluation.component';
import { AiMetricsComponent } from './features/dashboard/ai-metrics/ai-metrics.component';
import { AiComparisonComponent } from './features/dashboard/ai-model-comparison/ai-comparison.component';
import { AiResponseEvaluationComponent } from './features/dashboard/ai-response/ai-response-evaluation.component';
import { AiResearchDashboardComponent } from './features/ai-research/ai-research-dashboard.component';
import { AiBiasAnalysisComponent } from './features/ai-research/bias-analysis/ai-bias-analysis.component';
import { AiExplainabilityTradeoffComponent } from './features/ai-research/explainability-tradeoff/ai-explainability-tradeoff.component';
import { AiStabilityVarianceComponent } from './features/ai-research/stability-variance/ai-stability-variance.component';
import { AiHumanInTheLoopComponent } from './features/ai-research/human-in-loop/ai-human-in-loop.component';
import { AiHybridStrategyComponent } from './features/ai-research/hybrid-strategy/ai-hybrid-strategy.component';
import { AiResearchSummaryComponent } from './features/ai-research/research-summary/ai-research-summary.component';
import { AiEstimationHistoryPageComponent } from './features/history/ai-estimation-history-page.component';
import { HistoryDashboardComponent } from './features/history/pages/history-dashboard/history-dashboard.component';
import { ApiLogsDashboardComponent } from './features/api-logs/api-logs-dashboard.component';
import { AdminJiraConfigComponent } from './features/authentication/admin-jira-config/admin-jira-config.component';
import { AdminUserManagementComponent } from './features/authentication/admin-user-management/admin-user-management.component';
import { AdminSiteManagementComponent } from './features/authentication/admin-site-management/admin-site-management.component';
import { AdminSiteAssignmentComponent } from './features/authentication/admin-site-assignment/admin-site-assignment.component';
import { SiteConfigurationComponent } from './features/dashboard/site-configuration/site-configuration.component';
import { EstimationAnalysisComponent } from './features/dashboard/estimation-analysis/estimation-analysis.component';
import { UserEstimationsAnalysisComponent } from './features/dashboard/user-estimations-analysis/user-estimations-analysis.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'contact', component: ContactComponent },

    { path: 'login', component: LoginComponent },
    { path: 'register', component: AdminUserManagementComponent, canActivate: [AuthGuard, AdminGuard] },

    // Profile routes
    { path: 'view-profile', component: ViewProfileComponent, canActivate: [AuthGuard] },
    { path: 'user-profile/:id', component: UserProfileComponent, canActivate: [AuthGuard] },
    { path: 'update-profile/:id', component: UpdateProfileComponent, canActivate: [AuthGuard] },

    // Project and MCP routes
    { path: 'mcp', redirectTo: 'mcp/projects', pathMatch: 'full' },
    { path: 'mcp/projects', component: ProjectsHomeComponent, canActivate: [AuthGuard] },
    { path: 'mcp/bugs', component: ProjectsHomeComponent, canActivate: [AuthGuard] },
    { path: 'projects', component: ProjectsHomeComponent, canActivate: [AuthGuard] },
    { path: 'mcp/sites', component: ProjectsHomeComponent, canActivate: [AuthGuard] },
    { path: 'mcp/projects/:key/issues', component: IssuesHomeComponent, canActivate: [AuthGuard] },
    { path: 'create-project', component: CreateProjectComponent, canActivate: [AuthGuard] },
    { path: 'edit-project/:key', component: CreateProjectComponent, canActivate: [AuthGuard] },
    { path: 'project-details/:key', component: ProjectDetailComponent, canActivate: [AuthGuard] },
    { path: 'issues/:key', component: IssuesHomeComponent, canActivate: [AuthGuard] },
    { path: 'mcp/issues/:issueKey', component: IssueDetailComponent, canActivate: [AuthGuard] },
    { path: 'issue-details/:issueKey', component: IssueDetailComponent, canActivate: [AuthGuard] },
    { path: 'issue-details/:issueKey/ai-analysis', component: AiAnalysisPageComponent, canActivate: [AuthGuard] },
    { path: 'mcp/issues/:issueKey/analysis', component: AiAnalysisPageComponent, canActivate: [AuthGuard] },

    // AI estimations overview and dedicated pages
    { path: 'ai-estimations', component: AiEstimationsComponent, canActivate: [AuthGuard] },
    { path: 'ai-estimations/evaluation', component: AiEvaluationComponent, canActivate: [AuthGuard] },
    { path: 'ai-estimations/metrics', component: AiMetricsComponent, canActivate: [AuthGuard] },
    { path: 'ai-estimations/comparison', component: AiComparisonComponent, canActivate: [AuthGuard] },
    { path: 'ai-estimations/response-evaluation', component: AiResponseEvaluationComponent, canActivate: [AuthGuard] },
    { path: 'ai-history', component: AiEstimationHistoryPageComponent, canActivate: [AuthGuard] },
    { path: 'history', component: HistoryDashboardComponent, canActivate: [AuthGuard] },
    {
        path: 'ai-research',
        component: AiResearchDashboardComponent,
        canActivate: [AuthGuard],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'bias' },
            { path: 'bias', component: AiBiasAnalysisComponent },
            { path: 'explainability', component: AiExplainabilityTradeoffComponent },
            { path: 'stability', component: AiStabilityVarianceComponent },
            { path: 'human-in-loop', component: AiHumanInTheLoopComponent },
            { path: 'hybrid', component: AiHybridStrategyComponent },
            { path: 'summary', component: AiResearchSummaryComponent }
        ]
    },

    // Dashboards (by user id)
    { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'user-dashboard/:userId', component: UserDashboardComponent, canActivate: [AuthGuard] },
    { path: 'user/estimations-analysis', component: UserEstimationsAnalysisComponent, canActivate: [AuthGuard] },
    { path: 'admin-dashboard/:userId', component: AdminDashboardComponent, canActivate: [AuthGuard, AdminGuard] },

    // Admin settings
    { path: 'admin/jira-platform', component: AdminJiraConfigComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'admin/user-management', component: AdminUserManagementComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'admin/users', component: AdminUserManagementComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'admin/site-configuration', component: SiteConfigurationComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'admin/estimation-analysis', component: EstimationAnalysisComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'admin/sites', component: AdminSiteManagementComponent, canActivate: [AuthGuard, AdminGuard] },
    { path: 'admin/site-assignments', component: AdminSiteAssignmentComponent, canActivate: [AuthGuard, AdminGuard] },

    // API Logs Dashboard
    { path: 'api-logs', component: ApiLogsDashboardComponent, canActivate: [AuthGuard] },

    // Password reset
    { path: 'resetPassword', component: ResetPassowrdComponent },

    // 404
    { path: '**', component: NotFoundComponent }
];
