package com.pw.edu.pl.master.thesis.ai.dto.github;

import lombok.Data;

@Data
public class PreviewFixRequest {
    private String sessionId;
    private String issueKey;
    private String filePath;
    private String userPrompt;
}
