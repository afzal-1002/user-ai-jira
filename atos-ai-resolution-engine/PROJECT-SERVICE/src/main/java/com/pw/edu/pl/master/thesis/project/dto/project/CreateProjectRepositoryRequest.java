package com.pw.edu.pl.master.thesis.project.dto.project;

import lombok.Data;

@Data
public class CreateProjectRepositoryRequest {
    private String repoName;
    private String repoUrl;
    private String defaultBranch;
    private Long credentialId;
    private Boolean primaryRepository;
    private Boolean active;
}
