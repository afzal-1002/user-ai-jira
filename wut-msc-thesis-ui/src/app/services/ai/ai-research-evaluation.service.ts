import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiResearchEvaluationService {
  constructor(private http: HttpClient) {}

  getBiasAnalysis(): Observable<any> {
    return this.http.get<any>('/api/wut/ai/research/bias');
  }

  getExplainabilityTradeoff(): Observable<any> {
    return this.http.get<any>('/api/wut/ai/research/explainability-tradeoff');
  }

  getStabilityVariance(): Observable<any> {
    return this.http.get<any>('/api/wut/ai/research/stability-variance');
  }

  getHumanInLoopImpact(): Observable<any> {
    return this.http.get<any>('/api/wut/ai/research/human-in-loop');
  }

  getHybridStrategy(): Observable<any> {
    return this.http.get<any>('/api/wut/ai/research/hybrid-strategy');
  }

  getResearchSummary(): Observable<any> {
    return this.http.get<any>('/api/wut/ai/research/summary');
  }
}
