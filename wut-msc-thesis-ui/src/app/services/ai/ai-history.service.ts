import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EstimationHistoryRecord {
  issueKey: string;
  projectKey?: string;
  aiProvider: string;
  createdAt: string; // ISO date string
  estimatedHours: number;
  actualHours?: number;
  explanationEnabled?: boolean;
  userPromptProvided?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiHistoryService {
  constructor(private http: HttpClient) {}

  getEstimationHistory(): Observable<EstimationHistoryRecord[]> {
    return this.http.get<EstimationHistoryRecord[]>('/api/wut/ai/history/estimations');
  }
}
