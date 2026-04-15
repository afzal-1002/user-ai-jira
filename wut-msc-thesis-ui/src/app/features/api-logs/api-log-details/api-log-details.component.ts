import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiRequestLog } from '../../../models/api-log.model';

@Component({
  selector: 'app-api-log-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './api-log-details.component.html',
  styleUrl: './api-log-details.component.css'
})
export class ApiLogDetailsComponent {
  @Input() log!: ApiRequestLog;
  @Output() closeDetails = new EventEmitter<void>();

  expandedSections = {
    basic: true,
    request: true,
    response: false,
    error: false
  };

  toggleSection(section: keyof typeof this.expandedSections) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  getStatusClass(statusCode?: number): string {
    if (!statusCode) return '';
    if (statusCode >= 200 && statusCode < 300) return 'status-success';
    if (statusCode >= 300 && statusCode < 400) return 'status-info';
    if (statusCode >= 400 && statusCode < 500) return 'status-warning';
    return 'status-error';
  }

  getMethodClass(method: string): string {
    const methodLower = method.toLowerCase();
    if (methodLower === 'get') return 'method-get';
    if (methodLower === 'post') return 'method-post';
    if (methodLower === 'put') return 'method-put';
    if (methodLower === 'delete') return 'method-delete';
    if (methodLower === 'patch') return 'method-patch';
    return '';
  }

  formatJson(obj: any): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  }

  close() {
    this.closeDetails.emit();
  }
}
