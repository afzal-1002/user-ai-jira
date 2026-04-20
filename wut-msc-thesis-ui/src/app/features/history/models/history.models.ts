export interface AIHistoryResult {
  issueKey: string;
  projectKey?: string;
  aiProvider: string;
  createdAt: string; // ISO date
  estimatedHours: number;
  actualHours?: number;
  errorHours?: number;
  analysisTimeSec?: number;
  explanationEnabled?: boolean;
  userPromptProvided?: boolean;
}

export interface AccuracyTrendResult {
  timeBucket: string; // e.g. date or week label
  meanAbsoluteError: number;
}

export interface ModelComparisonResult {
  issueKey?: string;
  actualHours: number;
  geminiEstimate?: number;
  deepSeekEstimate?: number;
}

export interface ExplainabilityHistoryResult {
  aiProvider: string;
  explanationEnabled: boolean;
  avgError: number;
  avgResponseTime?: number;
  avgResponseTimeSec?: number;
}

export interface HumanInLoopHistoryResult {
  userPromptProvided: boolean;
  avgError: number;
  errorVariance?: number;
}

export interface StabilityHistoryResult {
  aiProvider: string;
  timeBucket?: string;
  estimationVariance: number;
  responseTimeVariance: number;
}

export interface AIResponseArchive {
  issueKey: string;
  projectKey?: string;
  aiProvider: string;
  createdAt: string;
  estimatedHours: number;
  actualHours?: number;
  explanationEnabled?: boolean;
  userPromptProvided?: boolean;
  prompt?: string;
  rawResponse?: string;
}

// Aggregated Data Models for Charts
export interface EstimationComparisonData {
  provider: string;
  avgEstimation: number;
  minEstimation: number;
  maxEstimation: number;
  count: number;
}

export interface StabilityOverTimeData {
  date: string;
  geminiEstimation?: number;
  deepseekEstimation?: number;
  geminiTime?: number;
  deepseekTime?: number;
}

export interface PerformanceMetricsData {
  provider: string;
  avgAnalysisTime: number;
  minAnalysisTime: number;
  maxAnalysisTime: number;
  medianAnalysisTime: number;
}

export interface ExplanationImpactData {
  explanationEnabled: boolean;
  provider: string;
  avgEstimation: number;
  count: number;
}

export interface PromptImpactData {
  promptProvided: boolean;
  provider: string;
  avgEstimation: number;
  avgAnalysisTime: number;
  count: number;
}

export interface UsageDistributionData {
  provider: string;
  count: number;
  percentage: number;
}

export interface FrequencyHeatmapData {
  provider: string;
  estimationRange: string;
  frequency: number;
}

// Explainability Impact Chart Data
export interface ExplainabilityImpactChartData {
  provider: string;
  withExplanation: number;
  withoutExplanation: number;
  overheadDelta: number;
}

export interface ExplainabilityOverheadData {
  provider: string;
  overhead: number;
}
// Stability & Variance Chart Data
export interface StabilityVarianceChartData {
  provider: string;
  estimationVariance: number;
  responseTimeVariance: number;
  totalVariance?: number;
}

export interface StabilityIndexData {
  provider: string;
  stabilityIndex: number;
  estimationVariance: number;
  responseTimeVariance: number;
}

export interface StabilityRadarData {
  provider: string;
  estimationStability: number; // 0-10 scale, inverse of variance
  responseTimeStability: number; // 0-10 scale, inverse of variance
}

export interface StabilityScatterPoint {
  provider: string;
  estimationVariance: number;
  responseTimeVariance: number;
}