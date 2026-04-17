package com.pw.edu.pl.master.thesis.ai.dto.github;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FixBugResponse {
    private String sessionId;
    private String branchName;
    private String issueKey;
    private String filePath;
    private String commitMessage;
    private String analysis;
}
