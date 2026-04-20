package com.pw.edu.pl.master.thesis.project.client;

import com.pw.edu.pl.master.thesis.project.configuration.FeignSecurityConfiguration;
import com.pw.edu.pl.master.thesis.project.dto.credentials.IntegrationCredentialResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "USER-SERVICE",
        contextId = "IntegrationCredentialClient",
        path = "/api/wut/integration-credentials",
        configuration = FeignSecurityConfiguration.class
)
public interface IntegrationCredentialClient {

    @GetMapping("/{credentialId}")
    IntegrationCredentialResponse getById(@PathVariable("credentialId") Long credentialId);
}
