package com.pw.edu.pl.master.thesis.ai.service.implementation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pw.edu.pl.master.thesis.ai.dto.ai.AIAnalysisRequest;
import com.pw.edu.pl.master.thesis.ai.dto.issue.issuedetails.IssueDetails;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.McpGeminiAnalysisRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpGeminiAnalysisResponse;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpServerConfigResponse;
import com.pw.edu.pl.master.thesis.ai.dto.ai.gemini.GeminiProperties;
import com.pw.edu.pl.master.thesis.ai.enums.AIModelType;
import com.pw.edu.pl.master.thesis.ai.exception.ValidationException;
import com.pw.edu.pl.master.thesis.ai.service.GeminiService;
import com.pw.edu.pl.master.thesis.ai.service.McpGeminiService;
import com.pw.edu.pl.master.thesis.ai.service.McpJiraGatewayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class McpGeminiServiceImplementation implements McpGeminiService {

    private final McpJiraGatewayService mcpJiraGatewayService;
    private final GeminiService geminiService;
    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;

    @Override
    public McpGeminiAnalysisResponse analyzeIssue(McpGeminiAnalysisRequest request) {
        if (request.getIssueKey() == null || request.getIssueKey().trim().isEmpty()) {
            throw new ValidationException("issueKey is required");
        }

        IssueDetails issueDetails = mcpJiraGatewayService.getIssueDetails(request.getIssueKey().trim());
        String issueJson = serializeIssue(issueDetails);
        Double actualResolutionHours = calculateActualResolutionHours(issueDetails);

        AIAnalysisRequest aiRequest = new AIAnalysisRequest();
        aiRequest.setIssueKey(request.getIssueKey().trim());
        aiRequest.setUserPrompt(request.getUserPrompt());
        aiRequest.setIssueJson(issueJson);
        aiRequest.setMarkdown(request.isMarkdown());
        aiRequest.setExplanation(request.isExplanation());
        aiRequest.setAiModel(AIModelType.GEMINI);
        aiRequest.setActualResolutionHours(actualResolutionHours);

        String generation = geminiService.generateFromIssue(aiRequest);
        McpServerConfigResponse activeConfiguration = mcpJiraGatewayService.getActiveConfiguration();

        return McpGeminiAnalysisResponse.builder()
                .issueKey(aiRequest.getIssueKey())
                .provider("GEMINI")
                .model(geminiProperties.getModel())
                .actualResolutionHours(actualResolutionHours)
                .issueJson(issueJson)
                .response(generation)
                .activeConfiguration(activeConfiguration)
                .build();
    }

    private String serializeIssue(IssueDetails issueDetails) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(issueDetails);
        } catch (Exception exception) {
            throw new ValidationException("Failed to serialize issue details");
        }
    }

    private Double calculateActualResolutionHours(IssueDetails issue) {
        if (issue == null
                || issue.getFields() == null
                || issue.getFields().getCreated() == null
                || issue.getFields().getResolutionDate() == null) {
            return null;
        }

        OffsetDateTime created = issue.getFields().getCreated();
        OffsetDateTime resolved = issue.getFields().getResolutionDate();
        long seconds = Duration.between(created, resolved).getSeconds();
        return seconds / 3600.0;
    }
}
