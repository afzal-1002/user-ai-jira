package com.pw.edu.pl.master.thesis.ai.service.implementation;

import com.pw.edu.pl.master.thesis.ai.client.issue.IssueClient;
import com.pw.edu.pl.master.thesis.ai.client.issue.IssueDetailsClient;
import com.pw.edu.pl.master.thesis.ai.client.jira.JiraIssueClient;
import com.pw.edu.pl.master.thesis.ai.client.jira.JiraCommentClient;
import com.pw.edu.pl.master.thesis.ai.client.project.ProjectClient;
import com.pw.edu.pl.master.thesis.ai.client.project.SiteClient;
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
import com.pw.edu.pl.master.thesis.ai.exception.ResourceNotFoundException;
import com.pw.edu.pl.master.thesis.ai.exception.ValidationException;
import com.pw.edu.pl.master.thesis.ai.service.McpService;
import com.pw.edu.pl.master.thesis.ai.service.McpGeminiService;
import com.pw.edu.pl.master.thesis.ai.service.McpJiraGatewayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@Slf4j
@RequiredArgsConstructor
public class McpServiceImplementation implements McpService {

    private final SiteClient siteClient;
    private final ProjectClient projectClient;
    private final IssueClient issueClient;
    private final IssueDetailsClient issueDetailsClient;
    private final JiraCommentClient jiraCommentClient;
    private final JiraIssueClient jiraIssueClient;
    private final McpJiraGatewayService mcpJiraGatewayService;
    private final McpGeminiService mcpGeminiService;

    @Override
    @Transactional(readOnly = true)
    public McpFrontendContextResponse getFrontendContext() {
        return McpFrontendContextResponse.builder()
                .activeConfiguration(mcpJiraGatewayService.getActiveConfiguration())
                .sites(getCurrentUserSites())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SiteResponse> getCurrentUserSites() {
        return mcpJiraGatewayService.getCurrentUserSites();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraProjectResponse> getJiraProjectsForSite(Long siteId) {
        SiteResponse site = resolveCurrentUserSite(siteId);
        return mcpJiraGatewayService.getJiraProjectsByBaseUrl(site.getBaseURL());
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraProjectResponse> getJiraProjectsForHostPart(String hostPart) {
        validateText(hostPart, "hostPart");
        return mcpJiraGatewayService.getJiraProjectsByHostPart(hostPart.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getLocalProjectsForSite(Long siteId) {
        SiteResponse site = resolveCurrentUserSite(siteId);
        return mcpJiraGatewayService.getLocalProjectsByBaseUrl(site.getBaseURL());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProjectDetails(String projectKey, String source) {
        String normalizedSource = normalizeSource(source);
        if ("jira".equals(normalizedSource)) {
            return mcpJiraGatewayService.getJiraProjectDetails(projectKey);
        }
        return mcpJiraGatewayService.getLocalProjectDetails(projectKey);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getProjectIssues(Long siteId, String hostPart, String projectKey, String source, Integer maxResults, String issueType) {
        validateText(projectKey, "projectKey");
        String normalizedSource = normalizeSource(source);
        if ("local".equals(normalizedSource)) {
            return issueClient.listIssueResponsesByProjectId(projectKey.trim());
        }

        String baseUrl = resolveBaseUrl(siteId, hostPart);
        return mcpJiraGatewayService.getJiraIssuesByBaseUrlAndProjectKey(
                baseUrl,
                projectKey.trim(),
                maxResults,
                issueType
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getProjectIssuesByHostPart(String hostPart, String projectKey, Integer maxResults, String issueType) {
        return getProjectIssues(null, hostPart, projectKey, "jira", maxResults, issueType);
    }

    @Override
    @Transactional(readOnly = true)
    public McpProjectIssuesDetailsResponse getProjectIssuesWithDetails(Long siteId, String projectKey, String source, Integer maxResults, String issueType) {
        String normalizedProjectKey = projectKey == null ? null : projectKey.trim();
        List<IssueResponse> issues = getProjectIssues(siteId, null, normalizedProjectKey, source, maxResults, issueType);
        String normalizedSource = normalizeSource(source);

        List<McpProjectIssuesDetailsResponse.McpProjectIssueWithDetails> detailedIssues = issues.stream()
                .filter(Objects::nonNull)
                .map(issue -> McpProjectIssuesDetailsResponse.McpProjectIssueWithDetails.builder()
                        .issueKey(issue.getKey())
                        .summary(issue)
                        .details(loadIssueDetailsSafely(issue.getKey()))
                        .build())
                .toList();

        return McpProjectIssuesDetailsResponse.builder()
                .projectKey(normalizedProjectKey)
                .source(normalizedSource)
                .total(detailedIssues.size())
                .issues(detailedIssues)
                .build();
    }

    @Override
    @Transactional
    public IssueResponseSummary createIssue(CreateIssueRequest request) {
        if (request == null || request.getFields() == null) {
            throw new ValidationException("Issue request fields are required");
        }
        return jiraIssueClient.createIssue(request);
    }

    @Override
    @Transactional
    public IssueResponse updateIssue(String issueKey, CreateIssueRequest request) {
        validateText(issueKey, "issueKey");
        if (request == null || request.getFields() == null) {
            throw new ValidationException("Issue request fields are required");
        }
        return jiraIssueClient.updateIssue(issueKey.trim(), request);
    }

    @Override
    @Transactional
    public String deleteIssue(String issueKey, boolean deleteSubtasks) {
        validateText(issueKey, "issueKey");
        return jiraIssueClient.deleteIssue(issueKey.trim(), deleteSubtasks);
    }

    @Override
    @Transactional(readOnly = true)
    public IssueResponse getIssueWithComments(String issueKey) {
        validateText(issueKey, "issueKey");
        return mcpJiraGatewayService.getIssueWithComments(issueKey.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public CommentResponse getIssueComment(String issueKey, String commentId) {
        validateText(issueKey, "issueKey");
        validateText(commentId, "commentId");
        return jiraCommentClient.getCommentByIssueKeyAndId(issueKey.trim(), commentId.trim());
    }

    @Override
    @Transactional
    public CommentResponse createIssueComment(String issueKey, CreateCommentRequest request) {
        validateText(issueKey, "issueKey");
        if (request == null || request.getBody() == null) {
            throw new ValidationException("Comment body is required");
        }
        return jiraCommentClient.addFullComment(issueKey.trim(), request);
    }

    @Override
    @Transactional
    public CommentResponse updateIssueComment(String issueKey, String commentId, UpdateCommentRequest request) {
        validateText(issueKey, "issueKey");
        validateText(commentId, "commentId");
        if (request == null || request.getBody() == null) {
            throw new ValidationException("Comment body is required");
        }
        return jiraCommentClient.updateComment(issueKey.trim(), commentId.trim(), request);
    }

    @Override
    @Transactional
    public String deleteIssueComment(String issueKey, String commentId) {
        validateText(issueKey, "issueKey");
        validateText(commentId, "commentId");
        return jiraCommentClient.deleteComment(issueKey.trim(), commentId.trim());
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request) {
        if (projectId == null) {
            throw new ValidationException("projectId is required");
        }
        if (request == null) {
            throw new ValidationException("Project request is required");
        }
        return projectClient.updateById(projectId, request);
    }

    @Override
    @Transactional(readOnly = true)
    public IssueDetails getIssueDetails(String issueKey) {
        validateText(issueKey, "issueKey");
        return issueDetailsClient.getIssueDetails(issueKey.trim());
    }

    @Override
    @Transactional
    public McpGeminiAnalysisResponse analyzeIssue(String issueKey, McpGeminiAnalysisRequest request) {
        validateText(issueKey, "issueKey");
        McpGeminiAnalysisRequest effectiveRequest = request == null
                ? McpGeminiAnalysisRequest.builder().build()
                : request;
        effectiveRequest.setIssueKey(issueKey.trim());
        return mcpGeminiService.analyzeIssue(effectiveRequest);
    }

    private SiteResponse resolveCurrentUserSite(Long siteId) {
        if (siteId == null) {
            throw new ValidationException("siteId is required");
        }
        return getCurrentUserSites().stream()
                .filter(site -> siteId.equals(site.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Site not found for current user: " + siteId));
    }

    private String normalizeSource(String source) {
        if (source == null || source.isBlank()) {
            return "jira";
        }
        String normalized = source.trim().toLowerCase(Locale.ROOT);
        if (!normalized.equals("jira") && !normalized.equals("local")) {
            throw new ValidationException("source must be either 'jira' or 'local'");
        }
        return normalized;
    }

    private void validateText(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new ValidationException(fieldName + " is required");
        }
    }

    private IssueDetails loadIssueDetailsSafely(String issueKey) {
        if (issueKey == null || issueKey.isBlank()) {
            return null;
        }
        try {
            return issueDetailsClient.getIssueDetails(issueKey.trim());
        } catch (Exception exception) {
            log.warn("Failed to load issue details for {}: {}", issueKey, exception.getMessage());
            return null;
        }
    }

    private String resolveBaseUrlForHostPart(String hostPart) {
        String normalizedHostPart = hostPart.trim();
        return getCurrentUserSites().stream()
                .filter(site -> site.getHostPart() != null)
                .filter(site -> site.getHostPart().equalsIgnoreCase(normalizedHostPart))
                .map(SiteResponse::getBaseURL)
                .filter(Objects::nonNull)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Site not found for current user hostPart: " + normalizedHostPart));
    }

    private String resolveBaseUrl(Long siteId, String hostPart) {
        if (siteId != null) {
            return resolveCurrentUserSite(siteId).getBaseURL();
        }
        if (hostPart != null && !hostPart.trim().isEmpty()) {
            return resolveBaseUrlForHostPart(hostPart);
        }
        throw new ValidationException("Either siteId or hostPart is required");
    }
}
