package com.pw.edu.pl.master.thesis.ai.dto.mcp.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class McpGeminiAnalysisResponse {
    private String issueKey;
    private String provider;
    private String model;
    private Double actualResolutionHours;
    private String issueJson;
    private String response;
    private McpServerConfigResponse activeConfiguration;
}
