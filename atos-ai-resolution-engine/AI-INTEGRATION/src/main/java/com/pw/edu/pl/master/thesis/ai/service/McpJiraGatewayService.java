package com.pw.edu.pl.master.thesis.ai.service;

import com.pw.edu.pl.master.thesis.ai.dto.issue.issuedetails.IssueDetails;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.Issuereponse.IssueResponse;
import com.pw.edu.pl.master.thesis.ai.dto.issue.response.JqlSearchResponse;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpServerConfigResponse;
import com.pw.edu.pl.master.thesis.ai.dto.project.JiraProjectResponse;
import com.pw.edu.pl.master.thesis.ai.dto.project.ProjectResponse;
import com.pw.edu.pl.master.thesis.ai.dto.site.SiteResponse;
import com.pw.edu.pl.master.thesis.ai.dto.issuetype.IssueTypeSummary;

import java.util.List;

public interface McpJiraGatewayService {

    IssueResponse getIssueSummary(String issueKey);

    IssueResponse getIssueWithComments(String issueKey);

    IssueDetails getIssueDetails(String issueKey);

    JqlSearchResponse searchIssues(String jql, Integer maxResults);

    JqlSearchResponse searchIssuesInDefaultProject(String summary, Integer maxResults);

    McpServerConfigResponse getActiveConfiguration();

    List<JiraProjectResponse> getCurrentUserJiraProjects();

    List<JiraProjectResponse> getJiraProjectsByBaseUrl(String baseUrl);

    List<JiraProjectResponse> getJiraProjectsByHostPart(String hostPart);

    List<IssueResponse> getJiraIssuesByBaseUrlAndProjectKey(String baseUrl, String projectKey, Integer maxResults, String issueType);

    ProjectResponse getJiraProjectDetails(String projectKey);

    List<ProjectResponse> getLocalProjectsByBaseUrl(String baseUrl);

    ProjectResponse getLocalProjectDetails(String projectKey);

    List<IssueTypeSummary> getProjectIssueTypes(String projectKey);

    List<SiteResponse> getCurrentUserSites();

    SiteResponse getSiteByBaseUrl(String baseUrl);
}
