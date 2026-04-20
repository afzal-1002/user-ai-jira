package com.pw.edu.pl.master.thesis.ai.dto.github;

import lombok.Data;

@Data
public class AnalyzeRepoBugRequest {
    private String projectKey;
    private String repoName;
    private String issueKey;
    private String baseBranch;
    private Long credentialId;
    private String filePath;
    private String userPrompt;
}
