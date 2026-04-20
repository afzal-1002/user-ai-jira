package com.pw.edu.pl.master.thesis.ai.dto.mcp.response;

import com.pw.edu.pl.master.thesis.ai.dto.issue.issuedetails.IssueDetails;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.Issuereponse.IssueResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class McpProjectIssuesDetailsResponse {
    private String projectKey;
    private String source;
    private Integer total;
    private List<McpProjectIssueWithDetails> issues;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class McpProjectIssueWithDetails {
        private String issueKey;
        private IssueResponse summary;
        private IssueDetails details;
    }
}
