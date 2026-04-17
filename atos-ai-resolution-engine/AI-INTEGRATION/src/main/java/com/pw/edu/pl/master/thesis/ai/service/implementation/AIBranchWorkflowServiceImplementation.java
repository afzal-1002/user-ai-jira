package com.pw.edu.pl.master.thesis.ai.service.implementation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pw.edu.pl.master.thesis.ai.client.issue.IssueDetailsClient;
import com.pw.edu.pl.master.thesis.ai.configuration.GitHubProperties;
import com.pw.edu.pl.master.thesis.ai.dto.ai.ChatMessage;
import com.pw.edu.pl.master.thesis.ai.dto.github.BranchSessionResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.FixBugRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.FixBugResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.GitHubFileData;
import com.pw.edu.pl.master.thesis.ai.dto.github.SendReviewRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.StartBranchSessionRequest;
import com.pw.edu.pl.master.thesis.ai.dto.issue.issuedetails.IssueDetails;
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
    private final ObjectMapper objectMapper;

    @Override
    public BranchSessionResponse startSession(StartBranchSessionRequest request) {
        String repoName = defaultText(request == null ? null : request.getRepoName(), gitHubProperties.getRepo());
        if (repoName == null || repoName.isBlank()) {
            throw new ValidationException("repoName is required");
        }

        String baseBranch = defaultText(request == null ? null : request.getBaseBranch(), gitHubProperties.getDefaultBranch());
        String branchName = defaultText(request == null ? null : request.getBranchName(), "ai-session-" + System.currentTimeMillis());

        try {
            gitHubService.createBranch(repoName, baseBranch, branchName);
        } catch (IOException exception) {
            throw new CustomException("Failed to create GitHub branch: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        BranchSession session = branchSessionService.create(
                repoName,
                baseBranch,
                branchName,
                request == null ? List.of() : request.getBugs()
        );
        return toResponse(session);
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

        GitHubFileData fileData;
        try {
            fileData = gitHubService.getFile(session.getRepoName(), session.getBranchName(), filePath);
        } catch (IOException exception) {
            throw new CustomException("Failed to load repository file: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        if (fileData.getContent() != null && fileData.getContent().length() > MAX_FILE_CONTENT_CHARS) {
            throw new ValidationException("Selected file is too large for AI patch generation. Provide a smaller target file.");
        }

        String updatedContent = generateUpdatedFile(issueDetails, fileData, request.getUserPrompt());
        String commitMessage = defaultText(request.getCommitMessage(), "AI fix for " + request.getIssueKey().trim());

        try {
            gitHubService.updateFile(session.getRepoName(), session.getBranchName(), filePath, updatedContent, commitMessage);
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

        String pullRequestUrl;
        try {
            pullRequestUrl = gitHubService.createPullRequest(
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
            candidates = gitHubService.listRepositoryFiles(session.getRepoName(), session.getBranchName());
        } catch (IOException exception) {
            throw new CustomException("Failed to list repository files: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }

        List<String> rankedCandidates = rankCandidates(issueDetails, candidates).stream()
                .limit(MAX_FILE_CANDIDATES)
                .toList();

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

        return rankedCandidates.stream()
                .filter(path -> path.equals(selection))
                .findFirst()
                .orElseThrow(() -> new ValidationException("AI selected an unknown file path. Provide filePath explicitly."));
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
}
