import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentNode } from '../../../../../models/interface/jira-issue.interface';

@Component({
  selector: 'app-comment-renderer',
  standalone: true,
  imports: [CommonModule, CommentRendererComponent],
  templateUrl: './comment-renderer.component.html',
  styleUrls: ['./comment-renderer.component.css']
})
export class CommentRendererComponent {
  @Input() content: DocumentNode[] = [];

  renderText(node: DocumentNode): string {
    if (!node) return '';
    
    if (node.text) {
      return node.text;
    }

    if (node.content && node.content.length > 0) {
      return node.content.map((child: DocumentNode) => this.renderText(child)).join('');
    }

    if (node.attrs?.shortName) {
      return node.attrs.shortName;
    }

    return '';
  }

  hasMark(node: DocumentNode, markType: string): boolean {
    return !!(node.marks && node.marks.some((m: any) => m.type === markType));
  }

  isNodeType(node: DocumentNode, type: string): boolean {
    return node?.type === type;
  }

  getEmojiText(attrs: any): string {
    return attrs?.shortName || '😀';
  }

  getMentionText(attrs: any): string {
    return attrs?.text || `@${attrs?.id || 'user'}`;
  }

  getStatusColor(attrs: any): string {
    const statusColor = attrs?.color || 'blue';
    const colorMap: { [key: string]: string } = {
      'blue': '#deebf7',
      'purple': '#eae6ff',
      'red': '#ffeceb',
      'yellow': '#fff1cc',
      'green': '#dffcf0'
    };
    return colorMap[statusColor] || '#deebf7';
  }

  getAlertClass(panelType: string): string {
    const classMap: { [key: string]: string } = {
      'info': 'alert-info',
      'note': 'alert-info',
      'warning': 'alert-warning',
      'success': 'alert-success',
      'error': 'alert-danger'
    };
    return classMap[panelType] || 'alert-info';
  }
}
