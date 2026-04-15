import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiRequestLog, ApiLogFilter, ApiLogStatistics } from '../../models/api-log.model';

@Injectable({
  providedIn: 'root'
})
export class ApiLogService {
  private logsSubject = new BehaviorSubject<ApiRequestLog[]>([]);
  public logs$ = this.logsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * 1. Create a new API log - called when an API error/failure occurs
   */
  createLog(log: ApiRequestLog): Observable<ApiRequestLog> {
    return this.http.post<ApiRequestLog>('/api/wut/logs', log);
  }

  /**
   * 2. Get all API logs
   */
  getAllLogs(): Observable<ApiRequestLog[]> {
    return this.http.get<ApiRequestLog[]>('/api/wut/logs');
  }

  /**
   * 3. Get single log by ID
   */
  getLogById(id: string | number): Observable<ApiRequestLog> {
    return this.http.get<ApiRequestLog>(`/api/wut/logs/${id}`);
  }

  /**
   * 4. Get only failed API logs (success=false)
   */
  getFailedLogs(): Observable<ApiRequestLog[]> {
    return this.http.get<ApiRequestLog[]>('/api/wut/logs/failed');
  }

  /**
   * 5. Get logs by HTTP status code
   */
  getLogsByStatus(statusCode: number): Observable<ApiRequestLog[]> {
    return this.http.get<ApiRequestLog[]>(`/api/wut/logs/status/${statusCode}`);
  }

  /**
   * 6. Get logs by HTTP method (GET, POST, PUT, DELETE)
   */
  getLogsByMethod(method: string): Observable<ApiRequestLog[]> {
    return this.http.get<ApiRequestLog[]>(`/api/wut/logs/method/${method}`);
  }

  /**
   * 7. Get logs by frontend app name
   */
  getLogsByFrontend(app: string): Observable<ApiRequestLog[]> {
    return this.http.get<ApiRequestLog[]>(`/api/wut/logs/frontend/${app}`);
  }

  /**
   * 8. Search logs by endpoint keyword
   */
  searchLogs(keyword: string): Observable<ApiRequestLog[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<ApiRequestLog[]>('/api/wut/logs/search', { params });
  }

  /**
   * 9. Get logs by time range
   */
  getLogsByTimeRange(startDate: string, endDate: string): Observable<ApiRequestLog[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);
    return this.http.get<ApiRequestLog[]>('/api/wut/logs/range', { params });
  }

  /**
   * 10. Update an existing log (admin only)
   */
  updateLog(id: string | number, log: ApiRequestLog): Observable<ApiRequestLog> {
    return this.http.put<ApiRequestLog>(`/api/wut/logs/${id}`, log);
  }

  /**
   * 11. Delete a log (admin only)
   */
  deleteLog(id: string | number): Observable<void> {
    return this.http.delete<void>(`/api/wut/logs/${id}`);
  }

  /**
   * Get logs with advanced filtering
   */
  getLogsWithFilter(filter: ApiLogFilter): Observable<ApiRequestLog[]> {
    let params = new HttpParams();

    if (filter.method) params = params.set('method', filter.method);
    if (filter.statusCode) params = params.set('status', filter.statusCode.toString());
    if (filter.frontend) params = params.set('app', filter.frontend);
    if (filter.keyword) params = params.set('keyword', filter.keyword);
    if (filter.startDate) params = params.set('start', filter.startDate);
    if (filter.endDate) params = params.set('end', filter.endDate);
    if (filter.failedOnly) params = params.set('failed', 'true');

    return this.http.get<ApiRequestLog[]>('/api/wut/logs', { params });
  }

  /**
   * Get API statistics
   */
  getStatistics(): Observable<ApiLogStatistics> {
    return this.http.get<ApiLogStatistics>('/api/wut/logs/statistics');
  }

  /**
   * Update logs in local subject
   */
  updateLocalLogs(logs: ApiRequestLog[]): void {
    this.logsSubject.next(logs);
  }

  /**
   * Get current logs from subject
   */
  getCurrentLogs(): ApiRequestLog[] {
    return this.logsSubject.value;
  }
}
