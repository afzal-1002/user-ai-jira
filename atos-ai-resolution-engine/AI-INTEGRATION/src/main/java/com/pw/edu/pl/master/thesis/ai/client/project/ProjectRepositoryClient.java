package com.pw.edu.pl.master.thesis.ai.client.project;

import com.pw.edu.pl.master.thesis.ai.configuration.FeignSecurityConfiguration;
import com.pw.edu.pl.master.thesis.ai.dto.project.ProjectRepositoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "PROJECT-SERVICE",
        contextId = "ProjectRepositoryClient",
        path = "/api/wut/projects",
        configuration = FeignSecurityConfiguration.class
)
public interface ProjectRepositoryClient {

    @GetMapping("/{projectKey}/repositories/default")
    ProjectRepositoryResponse getDefaultRepository(@PathVariable("projectKey") String projectKey);
}
