package com.pw.edu.pl.master.thesis.ai.contoller;

import com.pw.edu.pl.master.thesis.ai.dto.comment.CreateCommentRequest;
import com.pw.edu.pl.master.thesis.ai.dto.comment.UpdateCommentRequest;
import com.pw.edu.pl.master.thesis.ai.dto.issue.CreateIssueRequest;
import com.pw.edu.pl.master.thesis.ai.dto.issue.issuedetails.IssueDetails;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.Issuereponse.CommentResponse;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.Issuereponse.IssueResponse;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.IssueResponseSummary;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.McpGeminiAnalysisRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpFrontendContextResponse;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpGeminiAnalysisResponse;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpProjectIssuesDetailsResponse;
import com.pw.edu.pl.master.thesis.ai.dto.project.JiraProjectResponse;
import com.pw.edu.pl.master.thesis.ai.dto.project.ProjectResponse;
import com.pw.edu.pl.master.thesis.ai.dto.project.UpdateProjectRequest;
import com.pw.edu.pl.master.thesis.ai.dto.site.SiteResponse;
import com.pw.edu.pl.master.thesis.ai.service.McpService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wut/mcp/server")
@RequiredArgsConstructor
public class McpFrontendController {

    private final McpService mcpService;

    @GetMapping("/context")
    public McpFrontendContextResponse getContext() {
        return mcpService.getFrontendContext();
    }

    @GetMapping("/sites")
    public List<SiteResponse> getSites() {
        return mcpService.getCurrentUserSites();
    }

    @GetMapping("/sites/{siteId}/projects/jira")
    public List<JiraProjectResponse> getJiraProjectsForSite(@PathVariable Long siteId) {
        return mcpService.getJiraProjectsForSite(siteId);
    }

    @GetMapping("/sites/projects/jira/by-host-part")
    public List<JiraProjectResponse> getJiraProjectsForHostPart(@RequestParam String hostPart) {
        return mcpService.getJiraProjectsForHostPart(hostPart);
    }

    @GetMapping("/sites/{siteId}/projects/local")
    public List<ProjectResponse> getLocalProjectsForSite(@PathVariable Long siteId) {
        return mcpService.getLocalProjectsForSite(siteId);
    }

    @GetMapping("/projects/{projectKey}")
    public ProjectResponse getProjectDetails(@PathVariable String projectKey,
                                             @RequestParam(defaultValue = "jira") String source) {
        return mcpService.getProjectDetails(projectKey, source);
    }

    @PutMapping("/projects/{projectId}")
    public ProjectResponse updateProject(@PathVariable Long projectId,
                                         @RequestBody UpdateProjectRequest request) {
        return mcpService.updateProject(projectId, request);
    }

    @GetMapping("/projects/{projectKey}/issues")
    public List<IssueResponse> getProjectIssues(@PathVariable String projectKey,
                                                @RequestParam(required = false) Long siteId,
                                                @RequestParam(required = false) String hostPart,
                                                @RequestParam(defaultValue = "jira") String source,
                                                @RequestParam(required = false) Integer maxResults,
                                                @RequestParam(required = false) String issueType) {
        return mcpService.getProjectIssues(siteId, hostPart, projectKey, source, maxResults, issueType);
    }

    @GetMapping("/sites/projects/{projectKey}/issues/by-host-part")
    public List<IssueResponse> getProjectIssuesByHostPart(@PathVariable String projectKey,
                                                          @RequestParam String hostPart,
                                                          @RequestParam(required = false) Integer maxResults,
                                                          @RequestParam(required = false) String issueType) {
        return mcpService.getProjectIssuesByHostPart(hostPart, projectKey, maxResults, issueType);
    }

    @PostMapping("/issues")
    public IssueResponseSummary createIssue(@RequestBody CreateIssueRequest request) {
        return mcpService.createIssue(request);
    }

    @PutMapping("/issues/{issueKey}")
    public IssueResponse updateIssue(@PathVariable String issueKey,
                                     @RequestBody CreateIssueRequest request) {
        return mcpService.updateIssue(issueKey, request);
    }

    @DeleteMapping("/issues/{issueKey}")
    public String deleteIssue(@PathVariable String issueKey,
                              @RequestParam(defaultValue = "false") boolean deleteSubtasks) {
        return mcpService.deleteIssue(issueKey, deleteSubtasks);
    }

    @GetMapping("/projects/{projectKey}/issues/details")
    public McpProjectIssuesDetailsResponse getProjectIssuesWithDetails(@PathVariable String projectKey,
                                                                      @RequestParam Long siteId,
                                                                      @RequestParam(defaultValue = "jira") String source,
                                                                      @RequestParam(required = false) Integer maxResults,
                                                                      @RequestParam(required = false) String issueType) {
        return mcpService.getProjectIssuesWithDetails(siteId, projectKey, source, maxResults, issueType);
    }

    @GetMapping("/issues/{issueKey}")
    public IssueDetails getIssueDetails(@PathVariable String issueKey) {
        return mcpService.getIssueDetails(issueKey);
    }

    @GetMapping("/issues/{issueKey}/comments")
    public IssueResponse getIssueWithComments(@PathVariable String issueKey) {
        return mcpService.getIssueWithComments(issueKey);
    }

    @PostMapping("/issues/{issueKey}/comments")
    public CommentResponse createIssueComment(@PathVariable String issueKey,
                                              @RequestBody CreateCommentRequest request) {
        return mcpService.createIssueComment(issueKey, request);
    }

    @GetMapping("/issues/{issueKey}/comments/{commentId}")
    public CommentResponse getIssueComment(@PathVariable String issueKey,
                                           @PathVariable String commentId) {
        return mcpService.getIssueComment(issueKey, commentId);
    }

    @PutMapping("/issues/{issueKey}/comments/{commentId}")
    public CommentResponse updateIssueComment(@PathVariable String issueKey,
                                              @PathVariable String commentId,
                                              @RequestBody UpdateCommentRequest request) {
        return mcpService.updateIssueComment(issueKey, commentId, request);
    }

    @DeleteMapping("/issues/{issueKey}/comments/{commentId}")
    public String deleteIssueComment(@PathVariable String issueKey,
                                     @PathVariable String commentId) {
        return mcpService.deleteIssueComment(issueKey, commentId);
    }

    @PostMapping("/issues/{issueKey}/analysis")
    public McpGeminiAnalysisResponse analyzeIssue(@PathVariable String issueKey,
                                                  @RequestBody(required = false) McpGeminiAnalysisRequest request) {
        return mcpService.analyzeIssue(issueKey, request);
    }
}
