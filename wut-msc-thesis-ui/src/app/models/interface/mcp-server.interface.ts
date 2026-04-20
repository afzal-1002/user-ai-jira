export type McpProjectSource = 'jira' | 'local';

export interface LoginResponse {
  id?: number;
  firstName?: string;
  lastName?: string;
  accountId?: string | null;
  displayName?: string;
  emailAddress?: string;
  username?: string;
  roles?: string[];
  token: string;
  tokenType?: string;
  expiresInMs?: number;
  active?: boolean;
  [key: string]: unknown;
}

export interface SiteProjectSummary {
  id?: number;
  jiraId?: string;
  projectKey: string;
  projectName: string;
  [key: string]: unknown;
}

export interface SiteResponse {
  id: number;
  siteName: string;
  hostPart?: string;
  baseURL?: string;
  baseUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  defaultForUser?: boolean;
  projects?: SiteProjectSummary[];
  [key: string]: unknown;
}

export interface McpServerConfiguration {
  id?: number;
  serverName?: string;
  serverVersion?: string;
  transportType?: string;
  defaultProjectKey?: string;
  defaultMaxResults?: number;
  instructions?: string;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface McpServerContextResponse {
  activeConfiguration?: McpServerConfiguration;
  activeConfig?: McpServerConfiguration;
  sites: SiteResponse[];
  [key: string]: unknown;
}

export interface JiraProjectLead {
  accountId?: string;
  displayName?: string;
  emailAddress?: string;
  active?: boolean;
  avatarUrls?: Record<string, string>;
  [key: string]: unknown;
}

export interface JiraProjectIssueType {
  id?: number | string;
  name?: string;
  iconUrl?: string;
  description?: string;
  [key: string]: unknown;
}

export interface JiraProjectResponse {
  id?: number | string;
  key: string;
  name: string;
  projectName?: string;
  description?: string;
  projectTypeKey?: string;
  projectTemplateKey?: string;
  leadAccountId?: string;
  assigneeType?: string;
  style?: string;
  private?: boolean;
  lead?: JiraProjectLead;
  issueTypes?: JiraProjectIssueType[];
  avatarUrls?: Record<string, string>;
  [key: string]: unknown;
}

export interface ADFTextNode {
  type: 'text';
  text: string;
  [key: string]: unknown;
}

export interface ADFNode {
  type: string;
  content?: Array<ADFNode | ADFTextNode>;
  text?: string;
  attrs?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ADFDocument {
  type: 'doc';
  version: 1;
  content: ADFNode[];
  [key: string]: unknown;
}

export interface CreateIssueRequest {
  fields: {
    project: {
      id?: number | null;
      key: string;
      [key: string]: unknown;
    };
    issuetype: {
      id?: number | string | null;
      name: string;
      [key: string]: unknown;
    };
    summary: string;
    duedate?: string;
    assignee?: {
      id?: string;
      username?: string;
      emailAddress?: string;
      [key: string]: unknown;
    };
    description?: ADFDocument;
    labels?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface IssueStatusRef {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface IssuePriorityRef {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export interface IssueUserRef {
  accountId?: string;
  displayName?: string;
  emailAddress?: string;
  active?: boolean;
  accountType?: string;
  avatarUrls?: Record<string, string>;
  [key: string]: unknown;
}

export interface CommentResponse {
  self?: string;
  id: string;
  author?: IssueUserRef;
  body: ADFDocument;
  updateAuthor?: IssueUserRef;
  created?: string;
  updated?: string;
  visibility?: {
    type?: string;
    value?: string;
    identifier?: string;
    [key: string]: unknown;
  } | null;
  jsdPublic?: boolean;
  [key: string]: unknown;
}

export interface IssueFields {
  summary?: string;
  description?: ADFDocument;
  duedate?: string;
  project?: {
    id?: string;
    key?: string;
    name?: string;
    [key: string]: unknown;
  };
  statusResponse?: IssueStatusRef;
  priorityResponse?: IssuePriorityRef;
  status?: IssueStatusRef;
  priority?: IssuePriorityRef;
  assignee?: IssueUserRef;
  creator?: IssueUserRef;
  reporter?: IssueUserRef;
  created?: string;
  updated?: string;
  labels?: string[];
  issuetype?: {
    id?: string;
    name?: string;
    description?: string;
    [key: string]: unknown;
  };
  comment?: {
    startAt?: number;
    maxResults?: number;
    total?: number;
    comments?: CommentResponse[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface IssueResponse {
  expand?: string;
  id?: string;
  self?: string;
  key: string;
  fields: IssueFields;
  [key: string]: unknown;
}

export interface MediaRef {
  id: string;
  type: string;
  collection: string;
  [key: string]: unknown;
}

export interface IssueDetailsComment {
  title: string;
  hasAttachment: boolean;
  mediaRefs: MediaRef[];
  [key: string]: unknown;
}

export interface IssueDetails {
  title?: string;
  description?: string;
  hasAttachment?: boolean;
  comments?: IssueDetailsComment[];
  fields?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface McpProjectIssueDetailsItem {
  issueKey: string;
  summary: IssueResponse;
  details: IssueDetails;
  [key: string]: unknown;
}

export interface McpProjectIssuesDetailsResponse {
  projectKey: string;
  source?: string;
  total: number;
  issues: McpProjectIssueDetailsItem[];
  [key: string]: unknown;
}

export interface CreateCommentRequest {
  body: ADFDocument;
  visibility?: unknown;
  public?: boolean;
  [key: string]: unknown;
}

export interface UpdateCommentRequest {
  body: ADFDocument;
  visibility?: unknown;
  [key: string]: unknown;
}

export interface UpdateProjectRequest {
  projectName: string;
  description?: string;
  projectTypeKey?: string;
  leadAccountId?: string;
  baseUrl?: string;
  leadUsernameOrEmail?: string;
  username?: string;
  [key: string]: unknown;
}

export interface McpIssueAnalysisPayload {
  userPrompt: string;
  markdown: boolean;
  explanation: boolean;
  [key: string]: unknown;
}

export interface McpGeminiAnalysisResponse {
  issueKey: string;
  provider?: string;
  model?: string;
  actualResolutionHours?: number;
  issueJson?: string;
  response?: string;
  activeConfiguration?: McpServerConfiguration;
  [key: string]: unknown;
}
