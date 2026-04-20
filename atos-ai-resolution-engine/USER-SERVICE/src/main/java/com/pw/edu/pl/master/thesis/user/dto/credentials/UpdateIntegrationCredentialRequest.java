package com.pw.edu.pl.master.thesis.user.dto.credentials;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.pw.edu.pl.master.thesis.user.enums.IntegrationCredentialType;
import lombok.Data;

@Data
public class UpdateIntegrationCredentialRequest {
    private String name;
    private IntegrationCredentialType type;
    private String username;
    @JsonAlias("token")
    private String secret;
    private String secretReference;
}
