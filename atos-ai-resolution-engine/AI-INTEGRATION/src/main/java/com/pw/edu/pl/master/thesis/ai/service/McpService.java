package com.pw.edu.pl.master.thesis.ai.service;

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

import java.util.List;

public interface McpService {

    McpFrontendContextResponse getFrontendContext();

    List<SiteResponse> getCurrentUserSites();

    List<JiraProjectResponse> getJiraProjectsForSite(Long siteId);

    List<JiraProjectResponse> getJiraProjectsForHostPart(String hostPart);

    List<ProjectResponse> getLocalProjectsForSite(Long siteId);

    ProjectResponse getProjectDetails(String projectKey, String source);

    List<IssueResponse> getProjectIssues(Long siteId, String hostPart, String projectKey, String source, Integer maxResults, String issueType);

    List<IssueResponse> getProjectIssuesByHostPart(String hostPart, String projectKey, Integer maxResults, String issueType);

    McpProjectIssuesDetailsResponse getProjectIssuesWithDetails(Long siteId, String projectKey, String source, Integer maxResults, String issueType);

    IssueResponseSummary createIssue(CreateIssueRequest request);

    IssueResponse updateIssue(String issueKey, CreateIssueRequest request);

    String deleteIssue(String issueKey, boolean deleteSubtasks);

    IssueResponse getIssueWithComments(String issueKey);

    CommentResponse getIssueComment(String issueKey, String commentId);

    CommentResponse createIssueComment(String issueKey, CreateCommentRequest request);

    CommentResponse updateIssueComment(String issueKey, String commentId, UpdateCommentRequest request);

    String deleteIssueComment(String issueKey, String commentId);

    ProjectResponse updateProject(Long projectId, UpdateProjectRequest request);

    IssueDetails getIssueDetails(String issueKey);

    McpGeminiAnalysisResponse analyzeIssue(String issueKey, McpGeminiAnalysisRequest request);
}
