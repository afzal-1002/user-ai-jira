export type AiModelType = 'gemini' | 'deepseek';
export type AiBackendModel = 'GEMINI' | 'DEEPSEEK' | 'BOTH';

export interface AiIssueAnalysisOptions {
  issueKey: string;
  model: AiModelType;
  markdown: boolean;
  explanation: boolean;
  includeAttachment: boolean;
}

export interface AiChatRequest {
  model: AiModelType;
  message: string;
  markdown?: boolean;
  explanation?: boolean;
}

export interface DeepSeekChatPayload {
  prompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AiAnalyzeRequest {
  issueKey: string;
  userPrompt: string;
  markdown: boolean;
  explanation: boolean;
  aiModel: AiBackendModel;
  temperature: number;
}
