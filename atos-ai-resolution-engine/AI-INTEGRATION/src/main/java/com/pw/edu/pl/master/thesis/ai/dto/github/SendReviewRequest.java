package com.pw.edu.pl.master.thesis.ai.dto.github;

import lombok.Data;

@Data
public class SendReviewRequest {
    private String sessionId;
    private String title;
    private String description;
    private String baseBranch;
}
