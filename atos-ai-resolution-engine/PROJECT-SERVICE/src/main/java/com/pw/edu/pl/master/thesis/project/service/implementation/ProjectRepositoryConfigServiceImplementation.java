package com.pw.edu.pl.master.thesis.project.service.implementation;

import com.pw.edu.pl.master.thesis.project.client.IntegrationCredentialClient;
import com.pw.edu.pl.master.thesis.project.dto.credentials.IntegrationCredentialResponse;
import com.pw.edu.pl.master.thesis.project.dto.project.CreateProjectRepositoryRequest;
import com.pw.edu.pl.master.thesis.project.dto.project.ProjectRepositoryResponse;
import com.pw.edu.pl.master.thesis.project.dto.project.UpdateProjectRepositoryRequest;
import com.pw.edu.pl.master.thesis.project.exceptions.ResourceNotFoundException;
import com.pw.edu.pl.master.thesis.project.model.Project;
import com.pw.edu.pl.master.thesis.project.model.ProjectRepositoryConfig;
import com.pw.edu.pl.master.thesis.project.repository.ProjectRepository;
import com.pw.edu.pl.master.thesis.project.repository.ProjectRepositoryConfigRepository;
import com.pw.edu.pl.master.thesis.project.service.ProjectRepositoryConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProjectRepositoryConfigServiceImplementation implements ProjectRepositoryConfigService {

    private final ProjectRepository projectRepository;
    private final ProjectRepositoryConfigRepository projectRepositoryConfigRepository;
    private final IntegrationCredentialClient integrationCredentialClient;

    @Override
    @Transactional
    public ProjectRepositoryResponse create(String projectKey, CreateProjectRepositoryRequest request) {
        validateCreate(request);
        Project project = getProject(projectKey);
        validateCredential(request.getCredentialId());
        ensureUnique(project.getId(), request.getRepoName(), request.getRepoUrl(), null);

        ProjectRepositoryConfig config = ProjectRepositoryConfig.builder()
                .project(project)
                .repoName(normalizeRepoName(request.getRepoName()))
                .repoUrl(normalizeRepoUrl(request.getRepoUrl()))
                .defaultBranch(defaultBranch(request.getDefaultBranch()))
                .credentialId(request.getCredentialId())
                .primaryRepository(Boolean.TRUE.equals(request.getPrimaryRepository()))
                .active(!Boolean.FALSE.equals(request.getActive()))
                .build();

        if (config.isPrimaryRepository()) {
            clearPrimary(project.getId());
        }

        return toResponse(projectRepositoryConfigRepository.save(config));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectRepositoryResponse> listByProject(String projectKey) {
        Project project = getProject(projectKey);
        return projectRepositoryConfigRepository.findAllByProject_IdOrderByPrimaryRepositoryDescRepoNameAsc(project.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectRepositoryResponse getDefaultRepository(String projectKey) {
        ProjectRepositoryConfig config = projectRepositoryConfigRepository
                .findFirstByProject_KeyIgnoreCaseAndActiveTrueOrderByPrimaryRepositoryDescRepoNameAsc(projectKey)
                .orElseThrow(() -> new ResourceNotFoundException("No active repository configured for project: " + projectKey));
        return toResponse(config);
    }

    @Override
    @Transactional
    public ProjectRepositoryResponse update(String projectKey, Long repositoryId, UpdateProjectRepositoryRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }

        Project project = getProject(projectKey);
        ProjectRepositoryConfig config = projectRepositoryConfigRepository.findByIdAndProject_Id(repositoryId, project.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Repository config not found: " + repositoryId));

        String repoName = request.getRepoName() == null ? config.getRepoName() : normalizeRepoName(request.getRepoName());
        String repoUrl = request.getRepoUrl() == null ? config.getRepoUrl() : normalizeRepoUrl(request.getRepoUrl());
        ensureUnique(project.getId(), repoName, repoUrl, repositoryId);

        config.setRepoName(repoName);
        config.setRepoUrl(repoUrl);
        if (request.getDefaultBranch() != null) {
            config.setDefaultBranch(defaultBranch(request.getDefaultBranch()));
        }
        if (request.getCredentialId() != null) {
            validateCredential(request.getCredentialId());
            config.setCredentialId(request.getCredentialId());
        }
        if (request.getPrimaryRepository() != null) {
            if (request.getPrimaryRepository()) {
                clearPrimary(project.getId());
            }
            config.setPrimaryRepository(request.getPrimaryRepository());
        }
        if (request.getActive() != null) {
            config.setActive(request.getActive());
        }

        return toResponse(projectRepositoryConfigRepository.save(config));
    }

    @Override
    @Transactional
    public void delete(String projectKey, Long repositoryId) {
        Project project = getProject(projectKey);
        ProjectRepositoryConfig config = projectRepositoryConfigRepository.findByIdAndProject_Id(repositoryId, project.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Repository config not found: " + repositoryId));
        projectRepositoryConfigRepository.delete(config);
    }

    private void validateCreate(CreateProjectRepositoryRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        if (trimToNull(request.getRepoName()) == null) {
            throw new IllegalArgumentException("repoName is required");
        }
        if (trimToNull(request.getRepoUrl()) == null) {
            throw new IllegalArgumentException("repoUrl is required");
        }
        if (request.getCredentialId() == null) {
            throw new IllegalArgumentException("credentialId is required");
        }
    }

    private void ensureUnique(Long projectId, String repoName, String repoUrl, Long repositoryId) {
        boolean repoNameExists = repositoryId == null
                ? projectRepositoryConfigRepository.existsByProject_IdAndRepoNameIgnoreCase(projectId, repoName)
                : projectRepositoryConfigRepository.existsByProject_IdAndRepoNameIgnoreCaseAndIdNot(projectId, repoName, repositoryId);
        if (repoNameExists) {
            throw new IllegalArgumentException("Repository name already linked to project: " + repoName);
        }

        boolean repoUrlExists = repositoryId == null
                ? projectRepositoryConfigRepository.existsByProject_IdAndRepoUrlIgnoreCase(projectId, repoUrl)
                : projectRepositoryConfigRepository.existsByProject_IdAndRepoUrlIgnoreCaseAndIdNot(projectId, repoUrl, repositoryId);
        if (repoUrlExists) {
            throw new IllegalArgumentException("Repository URL already linked to project: " + repoUrl);
        }
    }

    private void validateCredential(Long credentialId) {
        IntegrationCredentialResponse credential = integrationCredentialClient.getById(credentialId);
        if (credential == null) {
            throw new IllegalArgumentException("Credential not found: " + credentialId);
        }
    }

    private void clearPrimary(Long projectId) {
        List<ProjectRepositoryConfig> configs =
                projectRepositoryConfigRepository.findAllByProject_IdOrderByPrimaryRepositoryDescRepoNameAsc(projectId);
        for (ProjectRepositoryConfig config : configs) {
            if (config.isPrimaryRepository()) {
                config.setPrimaryRepository(false);
            }
        }
    }

    private Project getProject(String projectKey) {
        return projectRepository.findByKey(projectKey.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectKey));
    }

    private ProjectRepositoryResponse toResponse(ProjectRepositoryConfig config) {
        return ProjectRepositoryResponse.builder()
                .id(config.getId())
                .projectKey(config.getProject().getKey())
                .repoName(config.getRepoName())
                .repoUrl(config.getRepoUrl())
                .defaultBranch(config.getDefaultBranch())
                .credentialId(config.getCredentialId())
                .primaryRepository(config.isPrimaryRepository())
                .active(config.isActive())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private String normalizeRepoName(String repoName) {
        String trimmed = trimToNull(repoName);
        if (trimmed == null) {
            throw new IllegalArgumentException("repoName is required");
        }
        return trimmed;
    }

    private String normalizeRepoUrl(String repoUrl) {
        String trimmed = trimToNull(repoUrl);
        if (trimmed == null) {
            throw new IllegalArgumentException("repoUrl is required");
        }
        return trimmed;
    }

    private String defaultBranch(String branch) {
        String trimmed = trimToNull(branch);
        return trimmed == null ? "main" : trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
