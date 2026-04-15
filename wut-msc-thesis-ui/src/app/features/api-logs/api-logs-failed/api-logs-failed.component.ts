import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiRequestLog } from '../../../models/api-log.model';

@Component({
  selector: 'app-api-logs-failed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-logs-failed.component.html',
  styleUrls: ['./api-logs-failed.component.css']
})
export class ApiLogsFailedComponent {
  @Input() logs: ApiRequestLog[] = [];

  get failedLogs(): ApiRequestLog[] {
    return this.logs.filter(log => !log.success);
  }

  getStatusClass(statusCode?: number): string {
    if (!statusCode) return 'status-unknown';
    if (statusCode >= 400 && statusCode < 500) return 'status-client-error';
    if (statusCode >= 500) return 'status-server-error';
    return 'status-unknown';
  }
}
