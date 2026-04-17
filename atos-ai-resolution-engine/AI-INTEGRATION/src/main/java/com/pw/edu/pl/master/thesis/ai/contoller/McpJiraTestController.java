package com.pw.edu.pl.master.thesis.ai.contoller;

import com.pw.edu.pl.master.thesis.ai.dto.issue.issuedetails.IssueDetails;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.Issuereponse.IssueResponse;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.JqlSearchResponse;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.McpJiraSearchRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.McpProjectSummarySearchRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpServerConfigResponse;
import com.pw.edu.pl.master.thesis.ai.dto.project.JiraProjectResponse;
import com.pw.edu.pl.master.thesis.ai.dto.project.ProjectResponse;
import com.pw.edu.pl.master.thesis.ai.dto.site.SiteResponse;
import com.pw.edu.pl.master.thesis.ai.dto.issuetype.IssueTypeSummary;
import com.pw.edu.pl.master.thesis.ai.service.McpJiraGatewayService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wut/mcp/jira")
@RequiredArgsConstructor
public class McpJiraTestController {

    private final McpJiraGatewayService service;

    @GetMapping("/config/active")
    public McpServerConfigResponse getActiveConfiguration() {
        return service.getActiveConfiguration();
    }

    @GetMapping("/issues/{issueKey}/summary")
    public IssueResponse getIssueSummary(@PathVariable String issueKey) {
        return service.getIssueSummary(issueKey);
    }

    @GetMapping("/issues/{issueKey}/details")
    public IssueDetails getIssueDetails(@PathVariable String issueKey) {
        return service.getIssueDetails(issueKey);
    }

    @PostMapping("/issues/search")
    public JqlSearchResponse searchIssues(@RequestBody McpJiraSearchRequest request) {
        return service.searchIssues(request.getJql(), request.getMaxResults());
    }

    @PostMapping("/issues/search/default-project")
    public JqlSearchResponse searchIssuesInDefaultProject(@RequestBody McpProjectSummarySearchRequest request) {
        return service.searchIssuesInDefaultProject(request.getSummary(), request.getMaxResults());
    }

    @GetMapping("/projects/jira/current")
    public List<JiraProjectResponse> getCurrentUserJiraProjects() {
        return service.getCurrentUserJiraProjects();
    }

    @GetMapping("/projects/jira")
    public List<JiraProjectResponse> getJiraProjectsByBaseUrl(@RequestParam String baseUrl) {
        return service.getJiraProjectsByBaseUrl(baseUrl);
    }

    @GetMapping("/projects/jira/by-host-part")
    public List<JiraProjectResponse> getJiraProjectsByHostPart(@RequestParam String hostPart) {
        return service.getJiraProjectsByHostPart(hostPart);
    }

    @GetMapping("/projects/jira/{projectKey}")
    public ProjectResponse getJiraProjectDetails(@PathVariable String projectKey) {
        return service.getJiraProjectDetails(projectKey);
    }

    @GetMapping("/projects/local")
    public List<ProjectResponse> getLocalProjectsByBaseUrl(@RequestParam String baseUrl) {
        return service.getLocalProjectsByBaseUrl(baseUrl);
    }

    @GetMapping("/projects/local/{projectKey}")
    public ProjectResponse getLocalProjectDetails(@PathVariable String projectKey) {
        return service.getLocalProjectDetails(projectKey);
    }

    @GetMapping("/projects/{projectKey}/issue-types")
    public List<IssueTypeSummary> getProjectIssueTypes(@PathVariable String projectKey) {
        return service.getProjectIssueTypes(projectKey);
    }

    @GetMapping("/sites/current")
    public List<SiteResponse> getCurrentUserSites() {
        return service.getCurrentUserSites();
    }

    @GetMapping("/sites")
    public SiteResponse getSiteByBaseUrl(@RequestParam String baseUrl) {
        return service.getSiteByBaseUrl(baseUrl);
    }
}
