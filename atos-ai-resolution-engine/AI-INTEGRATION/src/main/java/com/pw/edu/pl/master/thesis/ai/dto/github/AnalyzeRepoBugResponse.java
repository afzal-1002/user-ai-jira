package com.pw.edu.pl.master.thesis.ai.dto.github;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AnalyzeRepoBugResponse {
    private String projectKey;
    private String issueKey;
    private String repositoryName;
    private String repositoryUrl;
    private String baseBranch;
    private List<String> candidateFiles;
    private String recommendedFile;
    private String impactedCodeSnippet;
    private String analysisSummary;
    private List<String> possibleSolutions;
    private String suggestedBranchName;
}
