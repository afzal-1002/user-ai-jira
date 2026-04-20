package com.pw.edu.pl.master.thesis.ai.dto.mcp.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class McpGeminiAnalysisRequest {
    private String issueKey;
    private String userPrompt;
    private boolean markdown;
    private boolean explanation;
}
