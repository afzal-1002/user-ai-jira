package com.pw.edu.pl.master.thesis.ai.dto.project;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class ProjectRepositoryResponse {
    private Long id;
    private String projectKey;
    private String repoName;
    private String repoUrl;
    private String defaultBranch;
    private Long credentialId;
    private boolean primaryRepository;
    private boolean active;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
