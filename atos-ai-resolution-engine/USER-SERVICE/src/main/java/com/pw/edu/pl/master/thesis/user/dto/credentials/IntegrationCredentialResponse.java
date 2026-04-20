package com.pw.edu.pl.master.thesis.user.dto.credentials;

import com.pw.edu.pl.master.thesis.user.enums.IntegrationCredentialType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class IntegrationCredentialResponse {
    private Long id;
    private String name;
    private IntegrationCredentialType type;
    private String username;
    private String secretReference;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
