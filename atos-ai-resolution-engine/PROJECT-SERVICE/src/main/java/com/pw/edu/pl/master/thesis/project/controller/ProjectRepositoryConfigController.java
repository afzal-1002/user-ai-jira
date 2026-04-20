package com.pw.edu.pl.master.thesis.project.controller;

import com.pw.edu.pl.master.thesis.project.dto.project.CreateProjectRepositoryRequest;
import com.pw.edu.pl.master.thesis.project.dto.project.ProjectRepositoryResponse;
import com.pw.edu.pl.master.thesis.project.dto.project.UpdateProjectRepositoryRequest;
import com.pw.edu.pl.master.thesis.project.service.ProjectRepositoryConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wut/projects/{projectKey}/repositories")
@RequiredArgsConstructor
public class ProjectRepositoryConfigController {

    private final ProjectRepositoryConfigService projectRepositoryConfigService;

    @PostMapping
    public ResponseEntity<ProjectRepositoryResponse> create(
            @PathVariable String projectKey,
            @RequestBody CreateProjectRepositoryRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectRepositoryConfigService.create(projectKey, request));
    }

    @GetMapping
    public ResponseEntity<List<ProjectRepositoryResponse>> list(@PathVariable String projectKey) {
        return ResponseEntity.ok(projectRepositoryConfigService.listByProject(projectKey));
    }

    @GetMapping("/default")
    public ResponseEntity<ProjectRepositoryResponse> getDefault(@PathVariable String projectKey) {
        return ResponseEntity.ok(projectRepositoryConfigService.getDefaultRepository(projectKey));
    }

    @PutMapping("/{repositoryId}")
    public ResponseEntity<ProjectRepositoryResponse> update(
            @PathVariable String projectKey,
            @PathVariable Long repositoryId,
            @RequestBody UpdateProjectRepositoryRequest request
    ) {
        return ResponseEntity.ok(projectRepositoryConfigService.update(projectKey, repositoryId, request));
    }

    @DeleteMapping("/{repositoryId}")
    public ResponseEntity<Void> delete(@PathVariable String projectKey, @PathVariable Long repositoryId) {
        projectRepositoryConfigService.delete(projectKey, repositoryId);
        return ResponseEntity.noContent().build();
    }
}
