package com.pw.edu.pl.master.thesis.ai.dto.github;

import com.pw.edu.pl.master.thesis.ai.enums.BranchSessionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class BranchSessionResponse {
    private String sessionId;
    private String repoName;
    private String branchName;
    private String baseBranch;
    private BranchSessionStatus status;
    private List<String> bugs;
    private String pullRequestUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
