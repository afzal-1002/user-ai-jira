package com.pw.edu.pl.master.thesis.ai.dto.github;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PreviewFixResponse {
    private String sessionId;
    private String branchName;
    private String issueKey;
    private String filePath;
    private String originalContent;
    private String updatedContent;
    private String diffText;
    private String changeSummary;
}
