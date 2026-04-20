import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstimationHistoryRecord } from '../../services/ai/ai-history.service';

@Component({
  selector: 'app-estimation-history-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estimation-history-table.component.html',
  styleUrls: ['./estimation-history-table.component.css']
})
export class EstimationHistoryTableComponent {
  @Input() history: EstimationHistoryRecord[] = [];
}
