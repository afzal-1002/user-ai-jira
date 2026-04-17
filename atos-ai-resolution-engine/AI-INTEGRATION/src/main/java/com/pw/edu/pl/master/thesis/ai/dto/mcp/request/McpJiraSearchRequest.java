package com.pw.edu.pl.master.thesis.ai.dto.mcp.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class McpJiraSearchRequest {
    private String jql;
    private Integer maxResults;
}
