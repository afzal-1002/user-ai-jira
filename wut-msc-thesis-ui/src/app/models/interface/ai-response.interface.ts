export interface AiMediaRef {
  id: string;
  type: string;
  collection: string;
}

export interface AiCommentSummary {
  title: string;
  hasAttachment: boolean;
  mediaRefs: AiMediaRef[];
}

export interface AiDetailsSummary {
  title: string;
  description: string;
  hasAttachment: boolean;
  comments: AiCommentSummary[];
}

export interface AiIssueAnalysis {
  details?: AiDetailsSummary;
  issueKey: string;
  generation?: string;
  deepseek?: string;
  gemini?: string;
}
