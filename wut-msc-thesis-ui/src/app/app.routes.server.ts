import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'home', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'ai-estimations', renderMode: RenderMode.Prerender },
  { path: 'ai-estimations/evaluation', renderMode: RenderMode.Prerender },
  { path: 'ai-estimations/metrics', renderMode: RenderMode.Prerender },
  { path: 'ai-estimations/comparison', renderMode: RenderMode.Prerender },
  { path: 'ai-estimations/response-evaluation', renderMode: RenderMode.Prerender },
  { path: 'ai-research', renderMode: RenderMode.Prerender },
  { path: 'ai-research/bias', renderMode: RenderMode.Prerender },
  { path: 'ai-research/explainability', renderMode: RenderMode.Prerender },
  { path: 'ai-research/stability', renderMode: RenderMode.Prerender },
  { path: 'ai-research/human-in-loop', renderMode: RenderMode.Prerender },
  { path: 'ai-research/hybrid', renderMode: RenderMode.Prerender },
  { path: 'ai-research/summary', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Server }
];
