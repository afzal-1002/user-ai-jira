import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiRequestLog } from '../../../models/api-log.model';

@Component({
  selector: 'app-api-logs-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-logs-list.component.html',
  styleUrls: ['./api-logs-list.component.css']
})
export class ApiLogsListComponent {
  @Input() logs: ApiRequestLog[] = [];
  @Output() logSelected = new EventEmitter<ApiRequestLog>();

  getStatusClass(statusCode?: number): string {
    if (!statusCode) return 'status-unknown';
    if (statusCode >= 200 && statusCode < 300) return 'status-success';
    if (statusCode >= 300 && statusCode < 400) return 'status-redirect';
    if (statusCode >= 400 && statusCode < 500) return 'status-client-error';
    return 'status-server-error';
  }

  getMethodClass(method: string): string {
    return `method-${method.toLowerCase()}`;
  }

  getSuccessClass(success: boolean): string {
    return success ? 'success-true' : 'success-false';
  }

  viewDetails(log: ApiRequestLog): void {
    this.logSelected.emit(log);
  }
}
