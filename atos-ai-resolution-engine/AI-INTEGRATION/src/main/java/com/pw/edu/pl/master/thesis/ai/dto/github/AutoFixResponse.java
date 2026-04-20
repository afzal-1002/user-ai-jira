package com.pw.edu.pl.master.thesis.ai.dto.github;

import com.pw.edu.pl.master.thesis.ai.enums.BranchSessionStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AutoFixResponse {
    private String sessionId;
    private String projectKey;
    private String issueKey;
    private String repositoryName;
    private String repositoryUrl;
    private String branchName;
    private String baseBranch;
    private String compareUrl;
    private String pullRequestUrl;
    private BranchSessionStatus status;
    private List<String> changedFiles;
    private String commitMessage;
    private String changeSummary;
    private String userMessage;
}
