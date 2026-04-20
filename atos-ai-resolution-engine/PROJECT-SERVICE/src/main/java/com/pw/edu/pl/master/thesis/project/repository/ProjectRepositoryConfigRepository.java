package com.pw.edu.pl.master.thesis.project.repository;

import com.pw.edu.pl.master.thesis.project.model.ProjectRepositoryConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepositoryConfigRepository extends JpaRepository<ProjectRepositoryConfig, Long> {
    List<ProjectRepositoryConfig> findAllByProject_IdOrderByPrimaryRepositoryDescRepoNameAsc(Long projectId);
    Optional<ProjectRepositoryConfig> findByIdAndProject_Id(Long repositoryId, Long projectId);
    Optional<ProjectRepositoryConfig> findFirstByProject_KeyIgnoreCaseAndActiveTrueOrderByPrimaryRepositoryDescRepoNameAsc(String projectKey);
    boolean existsByProject_IdAndRepoUrlIgnoreCase(Long projectId, String repoUrl);
    boolean existsByProject_IdAndRepoUrlIgnoreCaseAndIdNot(Long projectId, String repoUrl, Long repositoryId);
    boolean existsByProject_IdAndRepoNameIgnoreCase(Long projectId, String repoName);
    boolean existsByProject_IdAndRepoNameIgnoreCaseAndIdNot(Long projectId, String repoName, Long repositoryId);
}
