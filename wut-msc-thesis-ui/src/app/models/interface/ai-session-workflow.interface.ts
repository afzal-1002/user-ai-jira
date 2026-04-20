export type AiSessionStatus =
  | 'CREATED'
  | 'ANALYZED'
  | 'PREVIEW_READY'
  | 'APPLIED'
  | 'REVIEW'
  | 'FAILED';

export interface BranchSession {
  sessionId: string;
  repoName: string;
  branchName: string;
  baseBranch: string;
  status: AiSessionStatus;
  bugs: string[];
  pullRequestUrl: string | null;
  createdAt: string;
  updatedAt: string;
  projectKey?: string;
  issueKey?: string;
  repositoryName?: string;
  repositoryUrl?: string;
  compareUrl?: string;
  changedFiles?: string[];
  commitMessage?: string;
  changeSummary?: string;
  userMessage?: string;
  analysisSummary?: string;
  recommendedFile?: string;
  candidateFiles?: string[];
  possibleSolutions?: string[];
  impactedCodeSnippet?: string;
  preview?: FixPreview;
  [key: string]: unknown;
}

export interface StartSessionRequest {
  projectKey: string;
  baseBranch: string;
  bugs: string[];
}

export type StartSessionResponse = BranchSession;

export interface AnalyzeRepoBugRequest {
  projectKey: string;
  issueKey: string;
  baseBranch: string;
  userPrompt: string;
}

export interface AnalyzeRepoBugResponse {
  projectKey: string;
  issueKey: string;
  repositoryName: string;
  repositoryUrl: string;
  baseBranch: string;
  candidateFiles: string[];
  recommendedFile: string;
  impactedCodeSnippet: string;
  analysisSummary: string;
  possibleSolutions: string[];
  suggestedBranchName: string;
}

export interface PreviewFixRequest {
  sessionId: string;
  issueKey: string;
  filePath: string;
  userPrompt: string;
}

export interface FixPreview {
  sessionId: string;
  issueKey: string;
  filePath: string;
  originalContent: string;
  updatedContent: string;
  diffText: string;
  changeSummary: string;
}

export interface ApplyApprovedFixRequest {
  sessionId: string;
  issueKey: string;
  filePath: string;
  updatedContent: string;
  commitMessage: string;
}

export interface ApplyFixResult {
  sessionId: string;
  projectKey: string;
  issueKey: string;
  repositoryName: string;
  repositoryUrl: string;
  branchName: string;
  baseBranch: string;
  compareUrl: string;
  pullRequestUrl: string | null;
  status: string;
  changedFiles: string[];
  commitMessage: string;
  changeSummary: string;
  userMessage: string;
}

export interface SendReviewRequest {
  sessionId: string;
  baseBranch: string;
  title: string;
  description: string;
}

export type SendReviewResponse = BranchSession;
