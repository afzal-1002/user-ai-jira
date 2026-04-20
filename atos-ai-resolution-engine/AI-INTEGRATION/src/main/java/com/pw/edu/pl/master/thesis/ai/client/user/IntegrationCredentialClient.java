package com.pw.edu.pl.master.thesis.ai.client.user;

import com.pw.edu.pl.master.thesis.ai.configuration.FeignSecurityConfiguration;
import com.pw.edu.pl.master.thesis.ai.dto.credentials.ResolvedIntegrationCredentialResponse;
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

    @GetMapping("/{credentialId}/resolved")
    ResolvedIntegrationCredentialResponse getResolved(@PathVariable("credentialId") Long credentialId);
}
