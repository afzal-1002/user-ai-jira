package com.pw.edu.pl.master.thesis.ai.dto.github;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GitHubFileData {
    private String path;
    private String sha;
    private String content;
}
