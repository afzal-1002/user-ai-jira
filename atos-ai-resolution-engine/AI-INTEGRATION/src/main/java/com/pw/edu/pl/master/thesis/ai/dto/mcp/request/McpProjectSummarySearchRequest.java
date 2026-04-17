package com.pw.edu.pl.master.thesis.ai.dto.mcp.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class McpProjectSummarySearchRequest {
    private String summary;
    private Integer maxResults;
}
