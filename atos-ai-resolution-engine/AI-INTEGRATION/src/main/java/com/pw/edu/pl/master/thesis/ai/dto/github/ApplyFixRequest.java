package com.pw.edu.pl.master.thesis.ai.dto.github;

import lombok.Data;

@Data
public class ApplyFixRequest {
    private String sessionId;
    private String projectKey;
    private String repoName;
    private String issueKey;
    private String baseBranch;
    private String branchName;
    private Long credentialId;
    private String filePath;
    private String userPrompt;
    private String updatedContent;
    private String commitMessage;
}
