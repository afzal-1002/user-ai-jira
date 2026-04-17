package com.pw.edu.pl.master.thesis.ai.model.github;

import com.pw.edu.pl.master.thesis.ai.enums.BranchSessionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
public class BranchSession {
    private String sessionId;
    private String repoName;
    private String branchName;
    private String baseBranch;
    private BranchSessionStatus status;
    @Builder.Default
    private List<String> bugs = new ArrayList<>();
    private String pullRequestUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
