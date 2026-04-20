// Jira Issue Response Interface - Complete structure for API response

export interface JiraIssueResponse {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: IssueFields;
  changelog?: Changelog;
}

export interface IssueFields {
  statuspageComponentIncidents?: any;
  resolution?: any;
  fixVersions?: any[];
  customfield_10030?: any;
  customfield_10031?: any;
  customfield_10032?: any;
  customfield_10033?: any;
  customfield_10034?: any;
  customfield_10035?: any;
  customfield_10036?: any;
  customfield_10037?: any;
  customfield_10038?: any;
  lastViewed?: any;
  priority: Priority;
  labels?: string[];
  timeestimate?: any;
  aggregatetimeoriginalestimate?: any;
  versions?: any[];
  issuelinks?: any[];
  assignee?: User;
  updated?: string;
  status: Status;
  components?: Component[];
  timeoriginalestimate?: any;
  description?: Description;
  security?: any;
  summary: string;
  environment?: any;
  duedate?: any;
  progress?: Progress;
  comment: CommentContainer;
  votes?: Votes;
  worklog?: WorklogContainer;
  project?: Project;
  issuetype: IssueType;
  timespent?: any;
  timetracking?: TimeTracking;
  created?: string;
  creator?: User;
  watches?: Watches;
  reporter?: User;
  customfield_10000?: any;
  customfield_10001?: any;
  aggregateprogress?: Progress;
  customfield_10002?: any;
  customfield_10003?: any;
  customfield_10004?: any;
  customfield_10005?: any;
  environment_description?: any;
  customfield_10006?: any;
  customfield_10007?: any;
  customfield_10008?: any;
  customfield_10009?: any;
  customfield_10010?: any;
  customfield_10011?: any;
  customfield_10012?: any;
  customfield_10013?: any;
  customfield_10014?: any;
  customfield_10015?: any;
  customfield_10016?: any;
  customfield_10017?: any;
  customfield_10018?: any;
  customfield_10019?: any;
  customfield_10020?: any;
  customfield_10021?: any;
  customfield_10022?: any;
  customfield_10023?: any;
  customfield_10024?: any;
  customfield_10025?: any;
  customfield_10026?: any;
  customfield_10027?: any;
  customfield_10028?: any;
  customfield_10029?: any;
  attachment?: Attachment[];
}

export interface Priority {
  self?: string;
  iconUrl?: string;
  name: string;
  id: string;
}

export interface Status {
  self?: string;
  description?: string;
  iconUrl?: string;
  name: string;
  id: string;
  statusCategory?: StatusCategory;
}

export interface StatusCategory {
  self?: string;
  id?: number;
  key?: string;
  colorName?: string;
  name?: string;
}

export interface User {
  self?: string;
  accountId?: string;
  emailAddress?: string;
  avatarUrls?: AvatarUrls;
  displayName?: string;
  active?: boolean;
  timeZone?: string;
  accountType?: string;
}

export interface AvatarUrls {
  '48x48'?: string;
  '24x24'?: string;
  '16x16'?: string;
  '32x32'?: string;
}

export interface Component {
  self?: string;
  id?: string;
  name?: string;
  description?: string;
}

export interface Description {
  version?: number;
  type?: string;
  content?: DocumentNode[];
}

export interface Progress {
  progress: number;
  total: number;
  percent?: number;
}

export interface CommentContainer {
  startAt: number;
  maxResults: number;
  total: number;
  comments: Comment[];
}

export interface Comment {
  self?: string;
  id?: string;
  author?: User;
  body?: DocumentBody;
  updateAuthor?: User;
  created?: string;
  updated?: string;
  jsdPublic?: boolean;
  visibility?: Visibility;
}

export interface DocumentBody {
  version?: number;
  type?: string;
  content?: DocumentNode[];
}

export interface DocumentNode {
  type: string;
  content?: DocumentNode[];
  text?: string;
  marks?: Mark[];
  attrs?: any;
  level?: number;
}

export interface Mark {
  type: string;
  attrs?: any;
}

export interface Visibility {
  type: string;
  value: string;
}

export interface Votes {
  self?: string;
  votes?: number;
  hasVoted?: boolean;
}

export interface WorklogContainer {
  startAt?: number;
  maxResults?: number;
  total?: number;
  worklogs?: Worklog[];
}

export interface Worklog {
  self?: string;
  author?: User;
  updateAuthor?: User;
  created?: string;
  updated?: string;
  timeSpent?: string;
  timeSpentSeconds?: number;
  id?: string;
  issueId?: string;
}

export interface Project {
  self?: string;
  id?: string;
  key?: string;
  name?: string;
  projectTypeKey?: string;
  simplified?: boolean;
  avatarUrls?: AvatarUrls;
}

export interface IssueType {
  self?: string;
  id?: string;
  description?: string;
  iconUrl?: string;
  name: string;
  subtask?: boolean;
  hierarchyLevel?: number;
}

export interface TimeTracking {
  originalEstimate?: string;
  remainingEstimate?: string;
  timeSpent?: string;
  originalEstimateSeconds?: number;
  remainingEstimateSeconds?: number;
  timeSpentSeconds?: number;
}

export interface Attachment {
  self?: string;
  id?: string;
  filename?: string;
  author?: User;
  created?: string;
  size?: number;
  mimeType?: string;
  content?: string;
  thumbnail?: string;
}

export interface Watches {
  self?: string;
  watchCount?: number;
  isWatching?: boolean;
}

export interface Changelog {
  startAt?: number;
  maxResults?: number;
  total?: number;
  histories?: History[];
}

export interface History {
  id?: string;
  author?: User;
  created?: string;
  items?: ChangeItem[];
}

export interface ChangeItem {
  field: string;
  fieldtype?: string;
  from?: any;
  fromString?: string;
  to?: any;
  toString?: string;
}
