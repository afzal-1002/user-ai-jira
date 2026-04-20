package com.pw.edu.pl.master.thesis.project.service;

import com.pw.edu.pl.master.thesis.project.dto.project.CreateProjectRepositoryRequest;
import com.pw.edu.pl.master.thesis.project.dto.project.ProjectRepositoryResponse;
import com.pw.edu.pl.master.thesis.project.dto.project.UpdateProjectRepositoryRequest;

import java.util.List;

public interface ProjectRepositoryConfigService {
    ProjectRepositoryResponse create(String projectKey, CreateProjectRepositoryRequest request);
    List<ProjectRepositoryResponse> listByProject(String projectKey);
    ProjectRepositoryResponse getDefaultRepository(String projectKey);
    ProjectRepositoryResponse update(String projectKey, Long repositoryId, UpdateProjectRepositoryRequest request);
    void delete(String projectKey, Long repositoryId);
}
