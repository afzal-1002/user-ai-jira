package com.pw.edu.pl.master.thesis.ai.service.implementation;

import com.pw.edu.pl.master.thesis.ai.client.issue.IssueDetailsClient;
import com.pw.edu.pl.master.thesis.ai.client.jira.JiraIssueClient;
import com.pw.edu.pl.master.thesis.ai.client.project.ProjectClient;
import com.pw.edu.pl.master.thesis.ai.client.project.SiteClient;
import com.pw.edu.pl.master.thesis.ai.client.user.CredentialClient;
import com.pw.edu.pl.master.thesis.ai.dto.credentials.UserCredentialResponse;
import com.pw.edu.pl.master.thesis.ai.dto.helper.JiraUrlBuilder;
import com.pw.edu.pl.master.thesis.ai.dto.issue.issuedetails.IssueDetails;
import com.pw.edu.pl.master.thesis.ai.dto.issue.request.JqlSearchRequest;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.Issuereponse.IssueResponse;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.JqlSearchResponse;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpServerConfigResponse;
import com.pw.edu.pl.master.thesis.ai.dto.project.JiraProjectResponse;
import com.pw.edu.pl.master.thesis.ai.dto.project.ProjectSearchPage;
import com.pw.edu.pl.master.thesis.ai.dto.project.ProjectSummary;
import com.pw.edu.pl.master.thesis.ai.dto.project.ProjectResponse;
import com.pw.edu.pl.master.thesis.ai.dto.site.SiteResponse;
import com.pw.edu.pl.master.thesis.ai.dto.issuetype.IssueTypeSummary;
import com.pw.edu.pl.master.thesis.ai.exception.ValidationException;
import com.pw.edu.pl.master.thesis.ai.model.McpServerConfig;
import com.pw.edu.pl.master.thesis.ai.service.McpJiraGatewayService;
import com.pw.edu.pl.master.thesis.ai.service.McpServerConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class McpJiraGatewayServiceImplementation implements McpJiraGatewayService {

    private final JiraIssueClient jiraIssueClient;
    private final IssueDetailsClient issueDetailsClient;
    private final ProjectClient projectClient;
    private final SiteClient siteClient;
    private final McpServerConfigService mcpServerConfigService;
    private final CredentialClient credentialClient;
    private final JiraUrlBuilder jiraUrlBuilder;
    private final RestTemplate restTemplate;

    @Override
    @Transactional(readOnly = true)
    public IssueResponse getIssueSummary(String issueKey) {
        validateIssueKey(issueKey);
        requireEnabledConfig();
        return jiraIssueClient.getIssueSummary(issueKey);
    }

    @Override
    @Transactional(readOnly = true)
    public IssueResponse getIssueWithComments(String issueKey) {
        validateIssueKey(issueKey);
        requireEnabledConfig();
        return jiraIssueClient.getIssueByKey(issueKey);
    }

    @Override
    @Transactional(readOnly = true)
    public IssueDetails getIssueDetails(String issueKey) {
        validateIssueKey(issueKey);
        requireEnabledConfig();
        return issueDetailsClient.getIssueDetails(issueKey);
    }

    @Override
    @Transactional(readOnly = true)
    public JqlSearchResponse searchIssues(String jql, Integer maxResults) {
        validateText(jql, "jql");
        McpServerConfig config = requireEnabledConfig();

        return jiraIssueClient.searchByJql(JqlSearchRequest.builder()
                .jql(jql.trim())
                .maxResults(resolveMaxResults(maxResults, config))
                .reconcileIssues(new ArrayList<>())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public JqlSearchResponse searchIssuesInDefaultProject(String summary, Integer maxResults) {
        validateText(summary, "summary");
        McpServerConfig config = requireEnabledConfig();

        if (config.getDefaultProjectKey() == null || config.getDefaultProjectKey().isBlank()) {
            throw new ValidationException("The active MCP configuration does not define defaultProjectKey");
        }

        String escapedSummary = summary.trim().replace("\"", "\\\"");
        String jql = "project = \"" + config.getDefaultProjectKey() + "\" AND summary ~ \"" + escapedSummary + "\"";

        return jiraIssueClient.searchByJql(JqlSearchRequest.builder()
                .jql(jql)
                .maxResults(resolveMaxResults(maxResults, config))
                .reconcileIssues(new ArrayList<>())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public McpServerConfigResponse getActiveConfiguration() {
        return mcpServerConfigService.getActive();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraProjectResponse> getCurrentUserJiraProjects() {
        requireEnabledConfig();
        return projectClient.getAllProjectsFromJiraForCurrentUserUrl().getBody();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraProjectResponse> getJiraProjectsByBaseUrl(String baseUrl) {
        validateText(baseUrl, "baseUrl");
        requireEnabledConfig();
        return projectClient.listJira(baseUrl.trim()).getBody();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JiraProjectResponse> getJiraProjectsByHostPart(String hostPart) {
        validateText(hostPart, "hostPart");
        requireEnabledConfig();

        String baseUrl = jiraUrlBuilder.normalizeJiraBaseUrl(hostPart.trim());
        UserCredentialResponse credential = credentialClient.getResolvedForCurrentUser(null, baseUrl);
        if (credential == null || isBlank(credential.getUsername()) || isBlank(credential.getToken())) {
            throw new ValidationException("Unable to resolve Jira credentials for hostPart: " + hostPart);
        }

        return fetchDetailedJiraProjects(baseUrl, credential.getUsername(), credential.getToken());
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueResponse> getJiraIssuesByBaseUrlAndProjectKey(String baseUrl, String projectKey, Integer maxResults, String issueType) {
        validateText(baseUrl, "baseUrl");
        validateText(projectKey, "projectKey");
        McpServerConfig config = requireEnabledConfig();

        String normalizedBaseUrl = jiraUrlBuilder.normalizeJiraBaseUrl(baseUrl.trim());
        UserCredentialResponse credential = credentialClient.getResolvedForCurrentUser(null, normalizedBaseUrl);
        if (credential == null || isBlank(credential.getUsername()) || isBlank(credential.getToken())) {
            throw new ValidationException("Unable to resolve Jira credentials for baseUrl: " + normalizedBaseUrl);
        }

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("jql", buildProjectIssuesJql(projectKey.trim(), issueType));
        request.put("maxResults", resolveMaxResults(maxResults, config));
        request.put("fields", List.of(
                "summary",
                "description",
                "project",
                "assignee",
                "reporter",
                "creator",
                "status",
                "issuetype",
                "priority",
                "parent",
                "created",
                "updated",
                "resolutiondate",
                "duedate",
                "timetracking",
                "comment"
        ));

        JqlSearchResponse response = exchange(
                jiraUrlBuilder.url(normalizedBaseUrl, com.pw.edu.pl.master.thesis.ai.enums.JiraApiEndpoint.SEARCH_JQL),
                HttpMethod.POST,
                request,
                credential.getUsername(),
                credential.getToken(),
                JqlSearchResponse.class
        );

        if (response == null || response.getIssues() == null) {
            return List.of();
        }
        return response.getIssues();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getJiraProjectDetails(String projectKey) {
        validateText(projectKey, "projectKey");
        requireEnabledConfig();
        return projectClient.getJiraProjectByKey(projectKey.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getLocalProjectsByBaseUrl(String baseUrl) {
        validateText(baseUrl, "baseUrl");
        requireEnabledConfig();
        return projectClient.listLocal(baseUrl.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getLocalProjectDetails(String projectKey) {
        validateText(projectKey, "projectKey");
        requireEnabledConfig();
        return projectClient.getProjectByKey(projectKey.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueTypeSummary> getProjectIssueTypes(String projectKey) {
        validateText(projectKey, "projectKey");
        requireEnabledConfig();
        return jiraIssueClient.getIssueTypesForProject(projectKey.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SiteResponse> getCurrentUserSites() {
        requireEnabledConfig();
        return siteClient.listMySites();
    }

    @Override
    @Transactional(readOnly = true)
    public SiteResponse getSiteByBaseUrl(String baseUrl) {
        validateText(baseUrl, "baseUrl");
        requireEnabledConfig();
        return siteClient.getSiteByURL(baseUrl.trim());
    }

    private McpServerConfig requireEnabledConfig() {
        McpServerConfig config = mcpServerConfigService.getActiveEntity();
        if (!Boolean.TRUE.equals(config.getEnabled())) {
            throw new ValidationException("The active MCP configuration is disabled");
        }
        return config;
    }

    private Integer resolveMaxResults(Integer maxResults, McpServerConfig config) {
        if (maxResults == null) {
            return config.getDefaultMaxResults();
        }
        if (maxResults <= 0) {
            throw new ValidationException("maxResults must be greater than zero");
        }
        return maxResults;
    }

    private void validateIssueKey(String issueKey) {
        validateText(issueKey, "issueKey");
    }

    private void validateText(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new ValidationException(fieldName + " is required");
        }
    }

    private List<JiraProjectResponse> fetchDetailedJiraProjects(String baseUrl, String jiraUsername, String jiraToken) {
        List<ProjectSummary> compactProjects = new ArrayList<>();
        int startAt = 0;
        int pageSize = 50;

        while (true) {
            String listUrl = UriComponentsBuilder
                    .fromUriString(jiraUrlBuilder.url(baseUrl, com.pw.edu.pl.master.thesis.ai.enums.JiraApiEndpoint.PROJECT_SEARCH))
                    .queryParam("startAt", startAt)
                    .queryParam("maxResults", pageSize)
                    .build(true)
                    .toUriString();

            ProjectSearchPage page = exchange(listUrl, HttpMethod.GET, jiraUsername, jiraToken, ProjectSearchPage.class);
            if (page == null || page.getValues() == null || page.getValues().isEmpty()) {
                break;
            }

            compactProjects.addAll(page.getValues());
            if (page.isLast()) {
                break;
            }
            startAt += page.getMaxResults();
        }

        return compactProjects.stream()
                .map(project -> fetchProjectDetails(baseUrl, project.getKey(), jiraUsername, jiraToken))
                .collect(Collectors.toList());
    }

    private JiraProjectResponse fetchProjectDetails(String baseUrl, String projectKey, String jiraUsername, String jiraToken) {
        String detailUrl = String.format(
                jiraUrlBuilder.url(baseUrl, com.pw.edu.pl.master.thesis.ai.enums.JiraApiEndpoint.PROJECT_ID_OR_KEY),
                projectKey
        );
        return exchange(detailUrl, HttpMethod.GET, jiraUsername, jiraToken, JiraProjectResponse.class);
    }

    private <T> T exchange(String url, HttpMethod method, String jiraUsername, String jiraToken, Class<T> responseType) {
        return exchange(url, method, null, jiraUsername, jiraToken, responseType);
    }

    private <T> T exchange(String url, HttpMethod method, Object payload, String jiraUsername, String jiraToken, Class<T> responseType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        if (payload != null) {
            headers.setContentType(MediaType.APPLICATION_JSON);
        }
        String basic = jiraUsername + ":" + jiraToken;
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + Base64.getEncoder()
                .encodeToString(basic.getBytes(StandardCharsets.UTF_8)));

        HttpEntity<?> entity = payload == null ? new HttpEntity<>(headers) : new HttpEntity<>(payload, headers);
        return restTemplate.exchange(url, method, entity, responseType).getBody();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String buildProjectIssuesJql(String projectKey, String issueType) {
        StringBuilder jql = new StringBuilder("project = \"").append(projectKey).append("\"");
        if (issueType != null && !issueType.isBlank()) {
            String escapedType = issueType.trim().replace("\"", "\\\"");
            jql.append(" AND issuetype = \"").append(escapedType).append("\"");
        }
        jql.append(" ORDER BY updated DESC");
        return jql.toString();
    }
}
