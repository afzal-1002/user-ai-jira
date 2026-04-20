package com.pw.edu.pl.master.thesis.user.client;

import com.pw.edu.pl.master.thesis.user.configuration.FeignSecurityConfiguration;
import com.pw.edu.pl.master.thesis.user.dto.project.ProjectResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.List;

@FeignClient(
        name = "PROJECT-SERVICE",
        contextId = "ProjectClient",
        path = "/api/wut/projects",
        configuration = FeignSecurityConfiguration.class
)
public interface ProjectClient {

    @PostMapping("/sync/all")
    List<ProjectResponse> syncAllFromJira();
}
