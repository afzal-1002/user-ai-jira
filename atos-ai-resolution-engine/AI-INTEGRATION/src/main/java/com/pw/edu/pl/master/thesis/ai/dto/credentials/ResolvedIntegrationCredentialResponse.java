package com.pw.edu.pl.master.thesis.ai.dto.credentials;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class ResolvedIntegrationCredentialResponse {
    private Long id;
    private String name;
    private String type;
    private String username;
    private String secret;
    private String secretReference;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
