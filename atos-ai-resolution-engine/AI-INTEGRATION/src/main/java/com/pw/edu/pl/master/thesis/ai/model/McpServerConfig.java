package com.pw.edu.pl.master.thesis.ai.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "mcp_server_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class McpServerConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String serverName;

    @Column(nullable = false, length = 30)
    private String serverVersion;

    @Column(nullable = false, length = 20)
    private String transportType;

    @Column(length = 40)
    private String defaultProjectKey;

    @Column(nullable = false)
    private Integer defaultMaxResults;

    @Column(length = 1000)
    private String instructions;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
