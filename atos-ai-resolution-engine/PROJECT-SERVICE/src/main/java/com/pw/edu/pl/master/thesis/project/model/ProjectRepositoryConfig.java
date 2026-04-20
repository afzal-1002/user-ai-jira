package com.pw.edu.pl.master.thesis.project.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(
        name = "project_repository_configs",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_project_repo_url", columnNames = {"project_id", "repo_url"}),
                @UniqueConstraint(name = "uk_project_repo_name", columnNames = {"project_id", "repo_name"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectRepositoryConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_repository_config_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "repo_name", nullable = false, length = 255)
    private String repoName;

    @Column(name = "repo_url", nullable = false, length = 1024)
    private String repoUrl;

    @Column(name = "default_branch", nullable = false, length = 255)
    private String defaultBranch;

    @Column(name = "credential_id", nullable = false)
    private Long credentialId;

    @Column(name = "is_primary", nullable = false)
    private boolean primaryRepository;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = this.createdAt;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
