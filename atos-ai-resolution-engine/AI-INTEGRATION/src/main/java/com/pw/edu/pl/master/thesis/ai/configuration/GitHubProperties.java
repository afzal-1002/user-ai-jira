package com.pw.edu.pl.master.thesis.ai.configuration;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "github")
public class GitHubProperties {
    private String token;
    private String repo;
    private String defaultBranch = "main";
}
