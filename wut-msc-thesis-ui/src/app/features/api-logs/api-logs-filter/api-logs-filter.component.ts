import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiLogFilter } from '../../../models/api-log.model';

@Component({
  selector: 'app-api-logs-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-logs-filter.component.html',
  styleUrl: './api-logs-filter.component.css'
})
export class ApiLogsFilterComponent implements OnInit {
  @Output() filterApplied = new EventEmitter<ApiLogFilter>();

  filter: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | '';
    statusCode?: number | '';
    frontend: string;
    startDate: string;
    endDate: string;
    keyword: string;
    successOnly: boolean;
  } = {
    method: '',
    statusCode: '',
    frontend: '',
    startDate: '',
    endDate: '',
    keyword: '',
    successOnly: false
  };

  methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  statusCodes = ['200', '201', '204', '400', '401', '403', '404', '409', '500', '502', '503'];
  frontends = [
    'wut-dashboard',
    'wut-analysis',
    'wut-research',
    'wut-admin',
    'wut-portfolio'
  ];

  showAdvanced = false;

  ngOnInit() {
    this.setDefaultDates();
  }

  setDefaultDates() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.filter.endDate = now.toISOString().split('T')[0];
    this.filter.startDate = sevenDaysAgo.toISOString().split('T')[0];
  }

  applyFilters() {
    const appliedFilter: ApiLogFilter = {
      method: (this.filter.method !== '') ? (this.filter.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') : undefined,
      statusCode: (this.filter.statusCode !== '') ? Number(this.filter.statusCode) : undefined,
      frontend: this.filter.frontend || undefined,
      keyword: this.filter.keyword || undefined,
      startDate: this.filter.startDate || undefined,
      endDate: this.filter.endDate || undefined,
      successOnly: this.filter.successOnly
    };

    this.filterApplied.emit(appliedFilter);
  }

  resetFilters() {
    this.filter = {
      method: '',
      statusCode: '',
      frontend: '',
      startDate: '',
      endDate: '',
      keyword: '',
      successOnly: false
    };
    this.setDefaultDates();
    this.applyFilters();
  }

  toggleAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }
}
