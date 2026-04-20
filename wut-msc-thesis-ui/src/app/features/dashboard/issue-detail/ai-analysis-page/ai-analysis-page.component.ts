import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { McpFrontendService, McpProjectSource } from '../../../../services/mcp/mcp-frontend.service';
import { McpFrontendStateService } from '../../../../services/mcp/mcp-frontend-state.service';
import { AiIssueAnalysis } from '../../../../models/interface/ai-response.interface';
import { AiBackendModel } from '../../../../models/interface/ai-analysis-options.interface';
import { AiResponseComponent } from '../ai-response/ai-response.component';

@Component({
  selector: 'app-ai-analysis-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AiResponseComponent],
  templateUrl: './ai-analysis-page.component.html',
  styleUrls: ['./ai-analysis-page.component.css']
})
export class AiAnalysisPageComponent implements OnInit {
  issueKey = '';
  siteId: number | null = null;
  source: McpProjectSource = 'jira';
  projectKey: string | null = null;
  isLoading = false;
  errorMessage = '';
  analysis: AiIssueAnalysis | null = null;
  isUpdating = false;
  updateSuccessMessage = '';

  // configuration state for AI request
  aiModel: AiBackendModel = 'GEMINI';
  markdown = true;
  explanation = true;
  userPrompt = '';
  temperature = 5.0;

  // selection state
  selectedCommentIndexes = new Set<number>();
  includeGeneration = true;
  visibilityRole = 'Administrators';

  commentModelChoice: AiBackendModel = 'GEMINI';

  // optional selection of specific markdown sections from the chosen AI response
  sectionSelections: { title: string; content: string; selected: boolean }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mcpFrontendService: McpFrontendService,
    private mcpFrontendStateService: McpFrontendStateService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.issueKey = params['issueKey'] || '';
      this.route.queryParams.subscribe((queryParams) => {
        this.siteId = queryParams['siteId'] ? Number(queryParams['siteId']) : this.mcpFrontendStateService.selectedSiteId;
        this.source = queryParams['source'] === 'local' ? 'local' : 'jira';
        this.projectKey = queryParams['projectKey'] || null;

        if (this.siteId) {
          this.mcpFrontendStateService.selectSiteById(this.siteId);
        }
      });

      if (!this.issueKey) {
        this.errorMessage = 'Missing issue key.';
        return;
      }
      // Wait for user to configure options and click Run Analysis
    });
  }

  runAnalysis(): void {
    if (!this.issueKey || this.isLoading) {
      return;
    }

    if (!this.siteId) {
      this.errorMessage = 'Please select a Jira site before running analysis.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.analysis = null;

    this.mcpFrontendService.analyzeIssue(this.issueKey, {
      userPrompt: this.userPrompt || 'Analyze this bug, possible root cause, severity, and estimated resolution time',
      markdown: this.markdown,
      explanation: this.explanation
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        const raw: any = res as any;
        const deepseekText = raw.deepseek || raw.deepSeek || '';
        const geminiText = raw.gemini || '';
        const fallbackText = raw.analysis || raw.result || raw.response || raw.message || '';
        const generation = raw.generation || deepseekText || geminiText || fallbackText;

        this.analysis = {
          ...(raw as AiIssueAnalysis),
          issueKey: raw.issueKey || this.issueKey,
          generation,
          deepseek: deepseekText || undefined,
          gemini: geminiText || undefined
        };

        this.commentModelChoice = 'GEMINI';

        this.rebuildSectionSelections();

        this.updateSuccessMessage = '';
        this.selectedCommentIndexes.clear();
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Failed to load AI analysis', err);
        this.errorMessage = err?.error?.message || err?.message || 'Failed to load AI analysis.';
      }
    });
  }

  goBackToIssue(): void {
    this.router.navigate(['/mcp/issues', this.issueKey], {
      queryParams: {
        siteId: this.siteId,
        source: this.source,
        projectKey: this.projectKey
      }
    });
  }

  toggleCommentSelection(index: number, checked: boolean): void {
    if (checked) {
      this.selectedCommentIndexes.add(index);
    } else {
      this.selectedCommentIndexes.delete(index);
    }
  }

  get hasSelection(): boolean {
    return this.includeGeneration || this.selectedCommentIndexes.size > 0;
  }

  updateCommentsFromSelection(): void {
    if (!this.analysis || !this.hasSelection || this.isUpdating) {
      return;
    }

    const texts: string[] = [];

    if (this.includeGeneration) {
      // If user picked specific sections, join only those; otherwise use the full response
      const pickedSections = this.sectionSelections.filter(s => s.selected);
      let generationText = '';

      if (pickedSections.length > 0) {
        generationText = pickedSections.map(s => s.content).join('\n\n');
      } else {
        generationText = this.getCurrentModelTextForComment();
      }

      if (generationText) {
        texts.push(generationText);
      }
    }

    const comments = this.analysis.details?.comments || [];
    this.selectedCommentIndexes.forEach(index => {
      const c = comments[index];
      if (c?.title) {
        texts.push(c.title);
      }
    });

    if (texts.length === 0) {
      return;
    }

    // Build AI Analysis header with metadata
    const content = this.buildAIAnalysisCommentContent(texts);

    const request = {
      body: {
        type: 'doc',
        version: 1,
        content
      },
      visibility: {
        type: 'role',
        value: this.visibilityRole
      }
    };

    const issueKey = this.analysis.issueKey || this.issueKey;

    this.isUpdating = true;
    this.updateSuccessMessage = '';
    this.errorMessage = '';

    // First check if AI comments already exist
    this.mcpFrontendService.getIssueWithComments(issueKey).subscribe({
      next: (issueWithComments: any) => {
        const comments = issueWithComments?.fields?.comment?.comments || issueWithComments?.comments || [];
        const existingComments = comments.filter((comment: any) => this.isAiComment(comment));
        console.log('🔍 Checking for existing AI comments:', existingComments);
        
        if (existingComments && existingComments.length > 0) {
          // AI comments already exist - don't allow adding more
          this.isUpdating = false;
          
          // Check if comments are actually visible or hidden
          const commentCount = existingComments.length;
          const isVisible = existingComments.some((c: any) => c?.visible !== false);
          
          this.errorMessage = `⚠️ AI Analysis Comments Already Exist: This issue already has ${commentCount} AI analysis comment(s).

These comments may be:
• Hidden from view (filtered by role or permissions)
• Existing in the system but not displaying properly

To add a new comment:
1️⃣  Contact your Jira administrator to check for hidden AI comments
2️⃣  Or try deleting comments from the issue if you have permission
3️⃣  Then return here and try adding a new comment

Alternatively, if you see no AI comments above, this may be a backend issue that needs investigation.`;
        } else {
          // No existing AI comments, safe to add new one
          console.log('✅ No existing AI comments found, proceeding to create');
          this.createNewComment(issueKey, request);
        }
      },
      error: (err: any) => {
        // If endpoint returns 404 or other error, just proceed with creation
        // The backend will catch duplicates during POST if they exist
        console.warn('⚠️ Could not check existing AI comments (endpoint may not be implemented):', err?.status);
        
        if (err?.status === 404) {
          console.log('📝 AI comments endpoint returned 404 - proceeding with comment creation');
          this.createNewComment(issueKey, request);
        } else {
          this.isUpdating = false;
          this.errorMessage = `⚠️ Connection Error: Could not verify existing comments.

Error: ${err?.status} ${err?.statusText || ''}

This is likely a temporary backend issue. Try again in a moment.`;
        }
      }
    });
  }

  /**
   * Helper method to create a new Jira comment
   */
  private createNewComment(issueKey: string, request: any): void {
    this.mcpFrontendService.createIssueComment(issueKey, request).subscribe({
      next: () => {
        this.isUpdating = false;
        this.updateSuccessMessage = '✅ Comment added to Jira successfully with selected AI content.';
        // Reset selections after successful submission
        this.selectedCommentIndexes.clear();
        this.includeGeneration = true;
        setTimeout(() => {
          this.updateSuccessMessage = '';
        }, 3000);
      },
      error: (err: any) => {
        this.isUpdating = false;
        console.error('Failed to add comment', err);
        
        // Handle specific error cases
        if (err?.status === 409) {
          this.errorMessage = `⚠️ Comment Conflict (409): The backend detected a duplicate or similar comment.

This could mean:
• A very similar AI analysis comment already exists
• The comment was partially saved before
• The backend's duplicate detection is being strict

To resolve:
1️⃣  Go back to the issue details page
2️⃣  Look for comments with "🤖 AI Analysis" header (even hidden ones)
3️⃣  Try deleting ALL AI analysis comments
4️⃣  Reload the page (F5)
5️⃣  Return here and try again with DIFFERENT selections

Or contact your administrator if the issue persists.`;
        } else {
          this.errorMessage = err?.error?.message || err?.message || 'Failed to add comment.';
        }
      }
    });
  }

  private isAiComment(comment: any): boolean {
    const text = this.extractText(comment?.body || {});
    return text.toLowerCase().includes('ai analysis') || text.toLowerCase().includes('root cause');
  }

  private extractText(node: any): string {
    if (!node) {
      return '';
    }

    if (typeof node.text === 'string') {
      return node.text;
    }

    if (Array.isArray(node.content)) {
      return node.content.map((child: any) => this.extractText(child)).join(' ');
    }

    return '';
  }

  private getCurrentModelTextForComment(): string {
    if (!this.analysis) {
      return '';
    }

    return this.analysis.gemini || this.analysis.generation || '';
  }

  private rebuildSectionSelections(): void {
    const text = this.getCurrentModelTextForComment();
    this.sectionSelections = [];

    if (!text) {
      return;
    }

    const lines = text.split(/\r?\n/);
    let currentTitle = '';
    let currentLines: string[] = [];

    const pushCurrent = () => {
      if (currentTitle) {
        this.sectionSelections.push({
          title: currentTitle,
          content: currentLines.join('\n'),
          selected: false
        });
      }
    };

    for (const line of lines) {
      const match = line.match(/^(#{2,6})\s+(.*)$/); // H2+ headings
      if (match) {
        pushCurrent();
        currentTitle = match[2].trim();
        currentLines = [line];
      } else if (currentTitle) {
        currentLines.push(line);
      }
    }

    pushCurrent();
  }

  private buildAtlassianContentFromTexts(texts: string[]): any[] {
    const docContent: any[] = [];

    const flushBulletList = (items: any[]) => {
      if (items.length > 0) {
        docContent.push({
          type: 'bulletList',
          content: items
        });
      }
    };

    for (const text of texts) {
      const lines = (text || '').split(/\r?\n/);
      let bulletItems: any[] = [];

      for (const rawLine of lines) {
        const line = rawLine.replace(/\s+$/g, '');
        const trimmed = line.trim();

        if (!trimmed) {
          flushBulletList(bulletItems);
          bulletItems = [];
          continue;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
          flushBulletList(bulletItems);
          bulletItems = [];

          const level = Math.min(headingMatch[1].length, 6);
          const headingText = this.stripInlineMarkdown(headingMatch[2]);

          docContent.push({
            type: 'heading',
            attrs: { level },
            content: [
              {
                type: 'text',
                text: headingText
              }
            ]
          });
          continue;
        }

        const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
        if (bulletMatch) {
          const itemText = this.stripInlineMarkdown(bulletMatch[1]);
          bulletItems.push({
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: itemText
                  }
                ]
              }
            ]
          });
          continue;
        }

        flushBulletList(bulletItems);
        bulletItems = [];

        const cleanedLine = this.stripInlineMarkdown(line);

        docContent.push({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: cleanedLine
            }
          ]
        });
      }

      flushBulletList(bulletItems);
      bulletItems = [];

      // add a blank paragraph between different text blocks to improve spacing
      docContent.push({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: ''
          }
        ]
      });
    }

    return docContent;
  }

  /**
   * Build complete AI Analysis comment with header, metadata, and formatted content
   * Follows ADF (Atlassian Document Format) for Jira comments
   */
  private buildAIAnalysisCommentContent(texts: string[]): any[] {
    const docContent: any[] = [];

    // Add AI Analysis header with strong formatting
    docContent.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '🤖 AI Analysis',
          marks: [{ type: 'strong' }]
        },
        {
          type: 'text',
          text: ` | Model: ${this.aiModel}`
        }
      ]
    });

    // Add metadata line
    const timestamp = new Date().toLocaleString();
    docContent.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `Generated: ${timestamp}`,
          marks: [{ type: 'code' }]
        }
      ]
    });

    // Add separator/spacing
    docContent.push({
      type: 'paragraph',
      content: [{ type: 'text', text: '' }]
    });

    // Add the main content with proper ADF formatting
    const mainContent = this.buildAtlassianContentFromTexts(texts);
    docContent.push(...mainContent);

    return docContent;
  }

  private stripInlineMarkdown(text: string): string {
    if (!text) {
      return '';
    }

    // remove bold markers **text** but keep the inner text
    let cleaned = text.replace(/\*\*(.*?)\*\*/g, '$1');

    // optionally, collapse multiple spaces left behind
    cleaned = cleaned.replace(/ {2,}/g, ' ');

    return cleaned;
  }
}