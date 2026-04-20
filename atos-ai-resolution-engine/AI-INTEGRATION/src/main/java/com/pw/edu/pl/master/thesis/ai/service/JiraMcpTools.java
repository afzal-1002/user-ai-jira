package com.pw.edu.pl.master.thesis.ai.service;

import com.pw.edu.pl.master.thesis.ai.client.issue.IssueDetailsClient;
import com.pw.edu.pl.master.thesis.ai.client.jira.JiraIssueClient;
import com.pw.edu.pl.master.thesis.ai.dto.issue.issuedetails.IssueDetails;
import com.pw.edu.pl.master.thesis.ai.dto.issue.request.JqlSearchRequest;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.Issuereponse.IssueResponse;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.JqlSearchResponse;
import com.pw.edu.pl.master.thesis.ai.model.McpServerConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JiraMcpTools {

    private final JiraIssueClient jiraIssueClient;
    private final IssueDetailsClient issueDetailsClient;
    private final McpServerConfigService mcpServerConfigService;

    @Tool(name = "jira_get_issue_summary", description = "Fetch the Jira issue summary by issue key using the internal Jira integration.")
    public IssueResponse getIssueSummary(
            @ToolParam(description = "The Jira issue key ") String issueKey) {
        requireEnabledConfig();
        return jiraIssueClient.getIssueSummary(issueKey);
    }

    @Tool(name = "jira_get_issue_details", description = "Fetch the full Jira issue details by issue key, including lifecycle fields useful for bug analysis.")
    public IssueDetails getIssueDetails(
            @ToolParam(description = "The Jira issue key") String issueKey) {
        requireEnabledConfig();
        return issueDetailsClient.getIssueDetails(issueKey);
    }

    @Tool(name = "jira_search_issues", description = "Search Jira issues with JQL. If maxResults is not provided, the active MCP configuration default is used.")
    public JqlSearchResponse searchIssues(
            @ToolParam(description = "A valid Jira JQL query string.") String jql,
            @ToolParam(description = "Maximum number of Jira issues to return.", required = false) Integer maxResults) {

        McpServerConfig config = requireEnabledConfig();

        JqlSearchRequest request = JqlSearchRequest.builder()
                .jql(jql)
                .maxResults(maxResults != null ? maxResults : config.getDefaultMaxResults())
                .build();

        return jiraIssueClient.searchByJql(request);
    }

    @Tool(name = "jira_search_default_project_issues", description = "Search issues inside the configured default Jira project using summary text. The active MCP configuration must define a default project key.")
    public JqlSearchResponse searchIssuesInDefaultProject(
            @ToolParam(description = "Text expected to appear in the issue summary.") String summary,
            @ToolParam(description = "Maximum number of Jira issues to return.", required = false) Integer maxResults) {

        McpServerConfig config = requireEnabledConfig();
        if (config.getDefaultProjectKey() == null || config.getDefaultProjectKey().isBlank()) {
            throw new IllegalStateException("The active MCP configuration does not define a defaultProjectKey");
        }

        String escapedSummary = summary.replace("\"", "\\\"");
        String jql = "project = \"" + config.getDefaultProjectKey() + "\" AND summary ~ \"" + escapedSummary + "\"";

        JqlSearchRequest request = JqlSearchRequest.builder()
                .jql(jql)
                .maxResults(maxResults != null ? maxResults : config.getDefaultMaxResults())
                .build();

        return jiraIssueClient.searchByJql(request);
    }

    private McpServerConfig requireEnabledConfig() {
        McpServerConfig config = mcpServerConfigService.getActiveEntity();
        if (!Boolean.TRUE.equals(config.getEnabled())) {
            throw new IllegalStateException("The active MCP configuration is disabled");
        }
        return config;
    }
}
