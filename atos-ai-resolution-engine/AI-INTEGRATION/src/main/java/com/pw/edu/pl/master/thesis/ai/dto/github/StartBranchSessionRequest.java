package com.pw.edu.pl.master.thesis.ai.dto.github;

import lombok.Data;

import java.util.List;

@Data
public class StartBranchSessionRequest {
    private String projectKey;
    private String repoName;
    private String baseBranch;
    private String branchName;
    private Long credentialId;
    private List<String> bugs;
}
