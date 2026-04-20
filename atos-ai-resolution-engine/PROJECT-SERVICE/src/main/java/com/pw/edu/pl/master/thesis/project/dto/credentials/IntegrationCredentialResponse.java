package com.pw.edu.pl.master.thesis.project.dto.credentials;

import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class IntegrationCredentialResponse {
    private Long id;
    private String name;
    private String type;
    private String username;
    private String secretReference;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
