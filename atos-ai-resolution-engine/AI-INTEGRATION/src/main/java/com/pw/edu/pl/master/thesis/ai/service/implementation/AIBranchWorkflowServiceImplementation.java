package com.pw.edu.pl.master.thesis.ai.service.implementation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pw.edu.pl.master.thesis.ai.client.issue.IssueDetailsClient;
import com.pw.edu.pl.master.thesis.ai.client.project.ProjectRepositoryClient;
import com.pw.edu.pl.master.thesis.ai.client.user.IntegrationCredentialClient;
import com.pw.edu.pl.master.thesis.ai.configuration.GitHubProperties;
import com.pw.edu.pl.master.thesis.ai.dto.credentials.ResolvedIntegrationCredentialResponse;
import com.pw.edu.pl.master.thesis.ai.dto.ai.ChatMessage;
import com.pw.edu.pl.master.thesis.ai.dto.github.AnalyzeRepoBugRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.AnalyzeRepoBugResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.ApplyFixRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.AutoFixRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.AutoFixResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.BranchSessionResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.FixBugRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.FixBugResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.GitHubFileData;
import com.pw.edu.pl.master.thesis.ai.dto.github.PreviewFixRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.PreviewFixResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.SendReviewRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.StartBranchSessionRequest;
import com.pw.edu.pl.master.thesis.ai.dto.issue.issuedetails.IssueDetails;
import com.pw.edu.pl.master.thesis.ai.dto.project.ProjectRepositoryResponse;
import com.pw.edu.pl.master.thesis.ai.enums.BranchSessionStatus;
import com.pw.edu.pl.master.thesis.ai.exception.CustomException;
import com.pw.edu.pl.master.thesis.ai.exception.ValidationException;
import com.pw.edu.pl.master.thesis.ai.model.github.BranchSession;
import com.pw.edu.pl.master.thesis.ai.service.AIBranchWorkflowService;
import com.pw.edu.pl.master.thesis.ai.service.BranchSessionService;
import com.pw.edu.pl.master.thesis.ai.service.GeminiService;
import com.pw.edu.pl.master.thesis.ai.service.GitHubService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AIBranchWorkflowServiceImplementation implements AIBranchWorkflowService {

    private static final int MAX_FILE_CANDIDATES = 200;
    private static final int MAX_FILE_CONTENT_CHARS = 60_000;

    private final GitHubService gitHubService;
    private final BranchSessionService branchSessionService;
    private final IssueDetailsClient issueDetailsClient;
    private final GeminiService geminiService;
    private final GitHubProperties gitHubProperties;
    private final ProjectRepositoryClient projectRepositoryClient;
    private final IntegrationCredentialClient integrationCredentialClient;
    private final ObjectMapper objectMapper;

    @Override
    public BranchSessionResponse startSession(StartBranchSessionRequest request) {
        GitHubContext gitHubContext = resolveGitHubContext(request);
        String repoName = gitHubContext.repoName();
        if (repoName == null || repoName.isBlank()) {
            throw new ValidationException("repoName is required");
        }

        String baseBranch = defaultText(request == null ? null : request.getBaseBranch(), gitHubContext.defaultBranch());
        String branchName = defaultText(request == null ? null : request.getBranchName(), "ai-session-" + System.currentTimeMillis());

        try {
            gitHubService.createBranch(gitHubContext.token(), repoName, baseBranch, branchName);
        } catch (IOException exception) {
            throw new CustomException("Failed to create GitHub branch: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        BranchSession session = branchSessionService.create(
                gitHubContext.projectKey(),
                repoName,
                gitHubContext.credentialId(),
                baseBranch,
                branchName,
                request == null ? List.of() : request.getBugs()
        );
        return toResponse(session);
    }

    @Override
    public AnalyzeRepoBugResponse analyzeRepoBug(AnalyzeRepoBugRequest request) {
        if (request == null) {
            throw new ValidationException("Analyze repo request is required");
        }
        if (isBlank(request.getIssueKey())) {
            throw new ValidationException("issueKey is required");
        }

        String issueKey = request.getIssueKey().trim();
        String projectKey = defaultText(trimToNull(request.getProjectKey()), inferProjectKey(List.of(issueKey)));

        StartBranchSessionRequest startRequest = new StartBranchSessionRequest();
        startRequest.setProjectKey(projectKey);
        startRequest.setRepoName(trimToNull(request.getRepoName()));
        startRequest.setBaseBranch(trimToNull(request.getBaseBranch()));
        startRequest.setCredentialId(request.getCredentialId());

        GitHubContext gitHubContext = resolveGitHubContext(startRequest);
        IssueDetails issueDetails = issueDetailsClient.getIssueDetails(issueKey);

        List<String> rankedCandidates;
        try {
            rankedCandidates = rankCandidates(
                    issueDetails,
                    gitHubService.listRepositoryFiles(
                            gitHubContext.token(),
                            gitHubContext.repoName(),
                            gitHubContext.defaultBranch()
                    )
            ).stream().limit(20).toList();
        } catch (IOException exception) {
            throw new CustomException("Failed to list repository files: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        String recommendedFile = trimToNull(request.getFilePath());
        if (recommendedFile == null && !rankedCandidates.isEmpty()) {
            recommendedFile = selectRecommendedFile(issueDetails, rankedCandidates);
        }

        GitHubFileData fileData = loadOptionalFile(
                gitHubContext.token(),
                gitHubContext.repoName(),
                gitHubContext.defaultBranch(),
                recommendedFile
        );

        String impactedCodeSnippet = fileData == null ? "" : abbreviate(fileData.getContent(), 1500);
        String analysisSummary = buildAnalysisSummary(issueDetails, recommendedFile, impactedCodeSnippet, request.getUserPrompt());

        return AnalyzeRepoBugResponse.builder()
                .projectKey(projectKey)
                .issueKey(issueKey)
                .repositoryName(gitHubContext.repoName())
                .repositoryUrl(buildRepositoryUrl(gitHubContext.repoName()))
                .baseBranch(gitHubContext.defaultBranch())
                .candidateFiles(rankedCandidates)
                .recommendedFile(defaultText(recommendedFile, ""))
                .impactedCodeSnippet(impactedCodeSnippet)
                .analysisSummary(analysisSummary)
                .possibleSolutions(buildPossibleSolutions(issueDetails, recommendedFile))
                .suggestedBranchName(defaultBranchName(issueKey))
                .build();
    }

    @Override
    public FixBugResponse fixBug(FixBugRequest request) {
        if (request == null) {
            throw new ValidationException("Fix bug request is required");
        }
        if (isBlank(request.getSessionId())) {
            throw new ValidationException("sessionId is required");
        }
        if (isBlank(request.getIssueKey())) {
            throw new ValidationException("issueKey is required");
        }

        BranchSession session = branchSessionService.get(request.getSessionId());
        IssueDetails issueDetails = issueDetailsClient.getIssueDetails(request.getIssueKey().trim());
        String filePath = resolveFilePath(session, issueDetails, request.getFilePath());
        String token = resolveGitHubToken(session.getCredentialId());

        GitHubFileData fileData;
        try {
            fileData = gitHubService.getFile(token, session.getRepoName(), session.getBranchName(), filePath);
        } catch (IOException exception) {
            throw new CustomException("Failed to load repository file: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        if (fileData.getContent() != null && fileData.getContent().length() > MAX_FILE_CONTENT_CHARS) {
            throw new ValidationException("Selected file is too large for AI patch generation. Provide a smaller target file.");
        }

        String updatedContent = generateUpdatedFile(issueDetails, fileData, request.getUserPrompt());
        String commitMessage = defaultText(request.getCommitMessage(), "AI fix for " + request.getIssueKey().trim());

        try {
            gitHubService.updateFile(token, session.getRepoName(), session.getBranchName(), filePath, updatedContent, commitMessage);
        } catch (IOException exception) {
            throw new CustomException("Failed to update GitHub file: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        addBugToSession(session, request.getIssueKey().trim());
        session.setUpdatedAt(OffsetDateTime.now());
        branchSessionService.save(session);

        return FixBugResponse.builder()
                .sessionId(session.getSessionId())
                .branchName(session.getBranchName())
                .issueKey(request.getIssueKey().trim())
                .filePath(filePath)
                .commitMessage(commitMessage)
                .analysis(updatedContent)
                .build();
    }

    @Override
    public PreviewFixResponse previewFix(PreviewFixRequest request) {
        if (request == null) {
            throw new ValidationException("Preview fix request is required");
        }
        if (isBlank(request.getSessionId())) {
            throw new ValidationException("sessionId is required");
        }
        if (isBlank(request.getIssueKey())) {
            throw new ValidationException("issueKey is required");
        }

        BranchSession session = branchSessionService.get(request.getSessionId());
        IssueDetails issueDetails = issueDetailsClient.getIssueDetails(request.getIssueKey().trim());
        String filePath = resolveFilePath(session, issueDetails, request.getFilePath());
        String token = resolveGitHubToken(session.getCredentialId());

        GitHubFileData fileData;
        try {
            fileData = gitHubService.getFile(token, session.getRepoName(), session.getBranchName(), filePath);
        } catch (IOException exception) {
            throw new CustomException("Failed to load repository file: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        String updatedContent = generateUpdatedFile(issueDetails, fileData, request.getUserPrompt());
        session.setUpdatedAt(OffsetDateTime.now());
        branchSessionService.save(session);

        return PreviewFixResponse.builder()
                .sessionId(session.getSessionId())
                .branchName(session.getBranchName())
                .issueKey(request.getIssueKey().trim())
                .filePath(filePath)
                .originalContent(fileData.getContent())
                .updatedContent(updatedContent)
                .diffText(buildDiff(fileData.getContent(), updatedContent, filePath))
                .changeSummary(buildChangeSummary(request.getIssueKey().trim(), filePath, request.getUserPrompt()))
                .build();
    }

    @Override
    public AutoFixResponse applyFix(ApplyFixRequest request) {
        if (request == null) {
            throw new ValidationException("Apply fix request is required");
        }
        if (isBlank(request.getSessionId())) {
            throw new ValidationException("sessionId is required");
        }
        if (isBlank(request.getIssueKey())) {
            throw new ValidationException("issueKey is required");
        }
        if (isBlank(request.getFilePath())) {
            throw new ValidationException("filePath is required");
        }

        BranchSession session = branchSessionService.get(request.getSessionId());
        String issueKey = request.getIssueKey().trim();
        String filePath = request.getFilePath().trim();
        String commitMessage = defaultText(trimToNull(request.getCommitMessage()), "AI fix for " + issueKey);
        String token = resolveGitHubToken(session.getCredentialId());

        String updatedContent = trimToNull(request.getUpdatedContent());
        if (updatedContent == null) {
            IssueDetails issueDetails = issueDetailsClient.getIssueDetails(issueKey);
            GitHubFileData currentFile = loadRequiredFile(token, session.getRepoName(), session.getBranchName(), filePath);
            updatedContent = generateUpdatedFile(issueDetails, currentFile, request.getUserPrompt());
        }

        try {
            gitHubService.updateFile(token, session.getRepoName(), session.getBranchName(), filePath, updatedContent, commitMessage);
        } catch (IOException exception) {
            throw new CustomException("Failed to update GitHub file: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        addBugToSession(session, issueKey);
        session.setUpdatedAt(OffsetDateTime.now());
        branchSessionService.save(session);

        RepositoryDetails repositoryDetails = resolveRepositoryDetails(session.getProjectKey(), session.getRepoName());
        String compareUrl = buildCompareUrl(repositoryDetails.repositoryUrl(), session.getBaseBranch(), session.getBranchName());

        return AutoFixResponse.builder()
                .sessionId(session.getSessionId())
                .projectKey(session.getProjectKey())
                .issueKey(issueKey)
                .repositoryName(session.getRepoName())
                .repositoryUrl(repositoryDetails.repositoryUrl())
                .branchName(session.getBranchName())
                .baseBranch(session.getBaseBranch())
                .compareUrl(compareUrl)
                .pullRequestUrl(session.getPullRequestUrl())
                .status(session.getStatus())
                .changedFiles(List.of(filePath))
                .commitMessage(commitMessage)
                .changeSummary(buildChangeSummary(issueKey, filePath, request.getUserPrompt()))
                .userMessage(buildUserMessage(repositoryDetails.repositoryUrl(), session.getBranchName(), session.getBaseBranch(), compareUrl))
                .build();
    }

    @Override
    public AutoFixResponse autoFix(AutoFixRequest request) {
        if (request == null) {
            throw new ValidationException("Auto-fix request is required");
        }
        if (isBlank(request.getIssueKey())) {
            throw new ValidationException("issueKey is required");
        }

        String issueKey = request.getIssueKey().trim();
        String projectKey = defaultText(trimToNull(request.getProjectKey()), inferProjectKey(List.of(issueKey)));

        StartBranchSessionRequest startRequest = new StartBranchSessionRequest();
        startRequest.setProjectKey(projectKey);
        startRequest.setRepoName(trimToNull(request.getRepoName()));
        startRequest.setBaseBranch(trimToNull(request.getBaseBranch()));
        startRequest.setBranchName(defaultText(trimToNull(request.getBranchName()), defaultBranchName(issueKey)));
        startRequest.setCredentialId(request.getCredentialId());
        startRequest.setBugs(List.of(issueKey));

        BranchSessionResponse session = startSession(startRequest);

        FixBugRequest fixBugRequest = new FixBugRequest();
        fixBugRequest.setSessionId(session.getSessionId());
        fixBugRequest.setIssueKey(issueKey);
        fixBugRequest.setFilePath(trimToNull(request.getFilePath()));
        fixBugRequest.setUserPrompt(trimToNull(request.getUserPrompt()));
        fixBugRequest.setCommitMessage(trimToNull(request.getCommitMessage()));
        FixBugResponse fixBugResponse = fixBug(fixBugRequest);

        BranchSessionResponse finalSession = session;
        if (Boolean.TRUE.equals(request.getCreatePullRequest())) {
            SendReviewRequest sendReviewRequest = new SendReviewRequest();
            sendReviewRequest.setSessionId(session.getSessionId());
            sendReviewRequest.setBaseBranch(session.getBaseBranch());
            sendReviewRequest.setTitle(defaultText(trimToNull(request.getPullRequestTitle()), "AI fix for " + issueKey));
            sendReviewRequest.setDescription(defaultText(
                    trimToNull(request.getPullRequestDescription()),
                    "Automated AI-generated fix for " + issueKey + ". Review the branch changes before merging."
            ));
            finalSession = sendForReview(sendReviewRequest);
        } else {
            finalSession = getSession(session.getSessionId());
        }

        RepositoryDetails repositoryDetails = resolveRepositoryDetails(projectKey, finalSession.getRepoName());
        String changeSummary = buildChangeSummary(issueKey, fixBugResponse.getFilePath(), request.getUserPrompt());
        String compareUrl = buildCompareUrl(repositoryDetails.repositoryUrl(), finalSession.getBaseBranch(), finalSession.getBranchName());

        return AutoFixResponse.builder()
                .sessionId(finalSession.getSessionId())
                .projectKey(projectKey)
                .issueKey(issueKey)
                .repositoryName(finalSession.getRepoName())
                .repositoryUrl(repositoryDetails.repositoryUrl())
                .branchName(finalSession.getBranchName())
                .baseBranch(finalSession.getBaseBranch())
                .compareUrl(compareUrl)
                .pullRequestUrl(finalSession.getPullRequestUrl())
                .status(finalSession.getStatus())
                .changedFiles(List.of(fixBugResponse.getFilePath()))
                .commitMessage(fixBugResponse.getCommitMessage())
                .changeSummary(changeSummary)
                .userMessage(buildUserMessage(repositoryDetails.repositoryUrl(), finalSession.getBranchName(), finalSession.getBaseBranch(), compareUrl))
                .build();
    }

    @Override
    public BranchSessionResponse sendForReview(SendReviewRequest request) {
        if (request == null || isBlank(request.getSessionId())) {
            throw new ValidationException("sessionId is required");
        }

        BranchSession session = branchSessionService.get(request.getSessionId());
        String baseBranch = defaultText(request.getBaseBranch(), session.getBaseBranch());
        String title = defaultText(request.getTitle(), "AI review for " + session.getBranchName());
        String description = defaultText(
                request.getDescription(),
                "Automated AI branch review request.\n\nBugs: " + String.join(", ", session.getBugs())
        );
        String token = resolveGitHubToken(session.getCredentialId());

        String pullRequestUrl;
        try {
            pullRequestUrl = gitHubService.createPullRequest(
                    token,
                    session.getRepoName(),
                    session.getBranchName(),
                    baseBranch,
                    title,
                    description
            );
        } catch (IOException exception) {
            throw new CustomException("Failed to create GitHub pull request: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        session.setStatus(BranchSessionStatus.REVIEW);
        session.setPullRequestUrl(pullRequestUrl);
        session.setUpdatedAt(OffsetDateTime.now());
        branchSessionService.save(session);
        return toResponse(session);
    }

    @Override
    public BranchSessionResponse getSession(String sessionId) {
        if (isBlank(sessionId)) {
            throw new ValidationException("sessionId is required");
        }
        return toResponse(branchSessionService.get(sessionId));
    }

    private String resolveFilePath(BranchSession session, IssueDetails issueDetails, String requestedFilePath) {
        if (!isBlank(requestedFilePath)) {
            return requestedFilePath.trim();
        }

        List<String> candidates;
        try {
            candidates = gitHubService.listRepositoryFiles(
                    resolveGitHubToken(session.getCredentialId()),
                    session.getRepoName(),
                    session.getBranchName()
            );
        } catch (IOException exception) {
            throw new CustomException("Failed to list repository files: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        List<String> rankedCandidates = rankCandidates(issueDetails, candidates).stream()
                .limit(MAX_FILE_CANDIDATES)
                .toList();

        if (rankedCandidates.isEmpty()) {
            throw new ValidationException("No candidate source files found. Provide filePath explicitly.");
        }

        String selection = selectRecommendedFile(issueDetails, rankedCandidates);

        return rankedCandidates.stream()
                .filter(path -> path.equals(selection))
                .findFirst()
                .orElseThrow(() -> new ValidationException("AI selected an unknown file path. Provide filePath explicitly."));
    }

    private String selectRecommendedFile(IssueDetails issueDetails, List<String> rankedCandidates) {
        if (rankedCandidates.isEmpty()) {
            throw new ValidationException("No candidate source files found. Provide filePath explicitly.");
        }

        String selection = stripCodeFences(geminiService.chat(ChatMessage.builder()
                .role("user")
                .content(buildFileSelectionPrompt(issueDetails, rankedCandidates))
                .build())).trim();

        if (selection.equalsIgnoreCase("NONE") || selection.isBlank()) {
            throw new ValidationException("AI could not confidently choose a file. Provide filePath explicitly.");
        }

        return selection;
    }

    private String generateUpdatedFile(IssueDetails issueDetails, GitHubFileData fileData, String userPrompt) {
        String issueJson;
        try {
            issueJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(issueDetails);
        } catch (Exception exception) {
            throw new CustomException("Failed to serialize issue details", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String result = geminiService.chat(ChatMessage.builder()
                .role("user")
                .content(buildFixPrompt(issueJson, fileData, userPrompt))
                .build());

        String cleaned = stripCodeFences(result);
        if (cleaned.isBlank()) {
            throw new CustomException("Gemini returned empty file content", HttpStatus.BAD_GATEWAY);
        }
        return cleaned;
    }

    private List<String> rankCandidates(IssueDetails issueDetails, List<String> candidates) {
        Set<String> keywords = extractKeywords(issueDetails);
        return candidates.stream()
                .filter(this::isSupportedCodeFile)
                .sorted(Comparator.comparingInt((String path) -> scorePath(path, keywords)).reversed()
                        .thenComparing(String::length))
                .toList();
    }

    private Set<String> extractKeywords(IssueDetails issueDetails) {
        StringBuilder text = new StringBuilder();
        if (issueDetails != null) {
            appendText(text, issueDetails.getTitle());
            appendText(text, issueDetails.getDescription());
        }

        String[] rawTokens = text.toString().toLowerCase(Locale.ROOT).split("[^a-z0-9]+");
        Set<String> keywords = new LinkedHashSet<>();
        for (String token : rawTokens) {
            if (token.length() >= 3) {
                keywords.add(token);
            }
        }
        return keywords;
    }

    private int scorePath(String path, Set<String> keywords) {
        String normalized = path.toLowerCase(Locale.ROOT);
        int score = 0;
        for (String keyword : keywords) {
            if (normalized.contains(keyword)) {
                score += 5;
            }
        }
        if (normalized.contains("test")) {
            score -= 2;
        }
        return score;
    }

    private boolean isSupportedCodeFile(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        return lower.endsWith(".java")
                || lower.endsWith(".kt")
                || lower.endsWith(".js")
                || lower.endsWith(".ts")
                || lower.endsWith(".tsx")
                || lower.endsWith(".jsx")
                || lower.endsWith(".py")
                || lower.endsWith(".json")
                || lower.endsWith(".yml")
                || lower.endsWith(".yaml")
                || lower.endsWith(".xml")
                || lower.endsWith(".properties")
                || lower.endsWith(".md");
    }

    private String buildFileSelectionPrompt(IssueDetails issueDetails, List<String> candidates) {
        return """
                You are selecting the most likely repository file to modify for a Jira bug fix.
                Return ONLY one exact path from the candidate list below.
                If none are plausible, return ONLY NONE.

                Issue title: %s
                Issue description: %s

                Candidate files:
                %s
                """.formatted(
                safeText(issueDetails == null ? null : issueDetails.getTitle()),
                safeText(issueDetails == null ? null : issueDetails.getDescription()),
                String.join("\n", candidates)
        );
    }

    private String buildFixPrompt(String issueJson, GitHubFileData fileData, String userPrompt) {
        return """
                You are fixing a bug in a source repository.
                Update the file content so it addresses the Jira issue.

                Rules:
                - Return ONLY the complete updated file content
                - Do not use markdown
                - Do not wrap the answer in code fences
                - Preserve unrelated code and formatting
                - Make the smallest safe change that fixes the issue

                Optional user guidance:
                %s

                Target file path:
                %s

                Jira issue JSON:
                %s

                Current file content:
                %s
                """.formatted(
                safeText(userPrompt),
                fileData.getPath(),
                issueJson,
                safeText(fileData.getContent())
        );
    }

    private GitHubContext resolveGitHubContext(StartBranchSessionRequest request) {
        String repoName = defaultText(request == null ? null : request.getRepoName(), gitHubProperties.getRepo());
        Long credentialId = request == null ? null : request.getCredentialId();
        String projectKey = request == null ? null : trimToNull(request.getProjectKey());
        if (projectKey == null) {
            projectKey = inferProjectKey(request == null ? null : request.getBugs());
        }

        if (projectKey != null) {
            ProjectRepositoryResponse repository = projectRepositoryClient.getDefaultRepository(projectKey);
            Long resolvedCredentialId = credentialId != null ? credentialId : repository.getCredentialId();
            String resolvedRepoName = isBlank(request == null ? null : request.getRepoName())
                    ? repository.getRepoName()
                    : request.getRepoName().trim();
            String resolvedBaseBranch = defaultText(
                    request == null ? null : request.getBaseBranch(),
                    defaultText(repository.getDefaultBranch(), gitHubProperties.getDefaultBranch())
            );
            return new GitHubContext(
                    projectKey,
                    resolvedRepoName,
                    resolvedCredentialId,
                    resolvedBaseBranch,
                    resolveGitHubToken(resolvedCredentialId)
            );
        }

        if (repoName != null && !repoName.isBlank()) {
            return new GitHubContext(
                    null,
                    repoName,
                    credentialId,
                    defaultText(request == null ? null : request.getBaseBranch(), gitHubProperties.getDefaultBranch()),
                    resolveGitHubToken(credentialId)
            );
        }

        throw new ValidationException("Unable to resolve GitHub repository. Configure a project repository mapping or provide repoName.");
    }

    private RepositoryDetails resolveRepositoryDetails(String projectKey, String repoName) {
        if (!isBlank(projectKey)) {
            ProjectRepositoryResponse repository = projectRepositoryClient.getDefaultRepository(projectKey);
            String resolvedRepoName = isBlank(repoName) ? repository.getRepoName() : repoName.trim();
            String resolvedRepoUrl = !isBlank(repository.getRepoUrl())
                    ? repository.getRepoUrl().trim()
                    : buildRepositoryUrl(resolvedRepoName);
            return new RepositoryDetails(resolvedRepoName, resolvedRepoUrl);
        }
        return new RepositoryDetails(repoName, buildRepositoryUrl(repoName));
    }

    private String buildRepositoryUrl(String repoName) {
        if (isBlank(repoName)) {
            return null;
        }
        String trimmed = repoName.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        return "https://github.com/" + trimmed;
    }

    private String buildCompareUrl(String repositoryUrl, String baseBranch, String branchName) {
        if (isBlank(repositoryUrl) || isBlank(baseBranch) || isBlank(branchName)) {
            return null;
        }
        String normalized = repositoryUrl.trim();
        if (normalized.endsWith(".git")) {
            normalized = normalized.substring(0, normalized.length() - 4);
        }
        return normalized + "/compare/" + baseBranch.trim() + "..." + branchName.trim();
    }

    private String buildChangeSummary(String issueKey, String filePath, String userPrompt) {
        String guidance = trimToNull(userPrompt);
        if (guidance != null) {
            return "Applied an AI-generated fix for " + issueKey + " in " + filePath + ". Guidance: " + guidance;
        }
        return "Applied an AI-generated fix for " + issueKey + " in " + filePath + ".";
    }

    private String buildAnalysisSummary(IssueDetails issueDetails, String recommendedFile, String impactedCodeSnippet, String userPrompt) {
        String response = stripCodeFences(geminiService.chat(ChatMessage.builder()
                .role("user")
                .content("""
                        Summarize the likely repository impact of this Jira bug.
                        Keep the answer concise and practical.

                        Issue title: %s
                        Issue description: %s
                        Recommended file: %s
                        Developer guidance: %s
                        File snippet:
                        %s
                        """.formatted(
                        safeText(issueDetails == null ? null : issueDetails.getTitle()),
                        safeText(issueDetails == null ? null : issueDetails.getDescription()),
                        safeText(recommendedFile),
                        safeText(userPrompt),
                        safeText(impactedCodeSnippet)
                ))
                .build()));
        return response.isBlank() ? "Analysis completed." : response;
    }

    private List<String> buildPossibleSolutions(IssueDetails issueDetails, String recommendedFile) {
        List<String> solutions = new ArrayList<>();
        if (!isBlank(recommendedFile)) {
            solutions.add("Inspect and update " + recommendedFile + " to handle the failing path described in the Jira issue.");
        }
        if (issueDetails != null && !isBlank(issueDetails.getDescription())) {
            solutions.add("Align the implementation with the issue description and verify the edge cases mentioned there.");
        }
        solutions.add("Add or adjust a focused regression test for the reported bug before merging.");
        return solutions;
    }

    private String buildUserMessage(String repositoryUrl, String branchName, String baseBranch, String compareUrl) {
        StringBuilder message = new StringBuilder("Code updated successfully.");
        if (!isBlank(repositoryUrl)) {
            message.append(" Repository: ").append(repositoryUrl).append('.');
        }
        if (!isBlank(branchName)) {
            message.append(" New branch: ").append(branchName).append('.');
        }
        if (!isBlank(baseBranch)) {
            message.append(" Compare it with ").append(baseBranch).append(" and merge when the changes are approved.");
        }
        if (!isBlank(compareUrl)) {
            message.append(" Compare URL: ").append(compareUrl);
        }
        return message.toString().trim();
    }

    private String defaultBranchName(String issueKey) {
        return "ai-fix-" + issueKey.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
    }

    private String resolveGitHubToken(Long credentialId) {
        if (credentialId == null) {
            String configuredToken = trimToNull(gitHubProperties.getToken());
            if (configuredToken != null) {
                return configuredToken;
            }
            throw new ValidationException("GitHub credential is not configured");
        }
        ResolvedIntegrationCredentialResponse credential = integrationCredentialClient.getResolved(credentialId);
        String secret = credential == null ? null : trimToNull(credential.getSecret());
        if (secret == null) {
            String configuredToken = trimToNull(gitHubProperties.getToken());
            if (configuredToken != null) {
                return configuredToken;
            }
            throw new ValidationException("Resolved integration credential secret is empty for credentialId=" + credentialId);
        }
        return secret;
    }

    private String inferProjectKey(List<String> bugs) {
        if (bugs == null || bugs.isEmpty()) {
            return null;
        }
        String first = trimToNull(bugs.getFirst());
        if (first == null) {
            return null;
        }
        int dashIndex = first.indexOf('-');
        if (dashIndex <= 0) {
            return null;
        }
        return first.substring(0, dashIndex).toUpperCase(Locale.ROOT);
    }

    private void addBugToSession(BranchSession session, String issueKey) {
        List<String> bugs = session.getBugs() == null ? new ArrayList<>() : new ArrayList<>(session.getBugs());
        if (bugs.stream().noneMatch(issueKey::equalsIgnoreCase)) {
            bugs.add(issueKey);
        }
        session.setBugs(bugs);
    }

    private BranchSessionResponse toResponse(BranchSession session) {
        return BranchSessionResponse.builder()
                .sessionId(session.getSessionId())
                .repoName(session.getRepoName())
                .branchName(session.getBranchName())
                .baseBranch(session.getBaseBranch())
                .status(session.getStatus())
                .bugs(session.getBugs())
                .pullRequestUrl(session.getPullRequestUrl())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }

    private String stripCodeFences(String text) {
        if (text == null) {
            return "";
        }
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline >= 0) {
                cleaned = cleaned.substring(firstNewline + 1);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
        }
        return cleaned.trim();
    }

    private GitHubFileData loadRequiredFile(String token, String repoName, String branch, String filePath) {
        try {
            return gitHubService.getFile(token, repoName, branch, filePath);
        } catch (IOException exception) {
            throw new CustomException("Failed to load repository file: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private GitHubFileData loadOptionalFile(String token, String repoName, String branch, String filePath) {
        if (isBlank(filePath)) {
            return null;
        }
        return loadRequiredFile(token, repoName, branch, filePath);
    }

    private String abbreviate(String text, int maxLength) {
        if (text == null) {
            return "";
        }
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + "\n...";
    }

    private String buildDiff(String originalContent, String updatedContent, String filePath) {
        List<String> originalLines = List.of(safeText(originalContent).split("\\R", -1));
        List<String> updatedLines = List.of(safeText(updatedContent).split("\\R", -1));
        int max = Math.max(originalLines.size(), updatedLines.size());
        StringBuilder diff = new StringBuilder()
                .append("--- ").append(filePath).append('\n')
                .append("+++ ").append(filePath).append('\n');

        for (int i = 0; i < max; i++) {
            String originalLine = i < originalLines.size() ? originalLines.get(i) : null;
            String updatedLine = i < updatedLines.size() ? updatedLines.get(i) : null;

            if (originalLine != null && updatedLine != null && originalLine.equals(updatedLine)) {
                continue;
            }
            if (originalLine != null) {
                diff.append('-').append(originalLine).append('\n');
            }
            if (updatedLine != null) {
                diff.append('+').append(updatedLine).append('\n');
            }
        }

        return diff.toString().trim();
    }

    private void appendText(StringBuilder builder, String text) {
        if (!isBlank(text)) {
            builder.append(text).append(' ');
        }
    }

    private String safeText(String text) {
        return text == null ? "" : text;
    }

    private String defaultText(String value, String defaultValue) {
        return isBlank(value) ? defaultValue : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private record GitHubContext(
            String projectKey,
            String repoName,
            Long credentialId,
            String defaultBranch,
            String token
    ) {
    }

    private record RepositoryDetails(
            String repoName,
            String repositoryUrl
    ) {
    }
}
