package com.pw.edu.pl.master.thesis.user.model.site;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(
        name = "site",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_site_host_part", columnNames = "host_part"),
                @UniqueConstraint(name = "uk_site_base_url", columnNames = "base_url")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Site {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "site_id")
    private Long id;

    @Column(name = "site_name", nullable = false, length = 120)
    private String siteName;

    @Column(name = "host_part", nullable = false, unique = true, length = 200)
    private String hostPart;

    @Column(name = "base_url", nullable = false, unique = true, length = 400)
    private String baseUrl;

    @Column(name = "jira_username", nullable = false, length = 255)
    private String jiraUsername;

    @Column(name = "jira_token", nullable = false, length = 2048)
    private String jiraToken;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime creationDate;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updateDate;

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<UserSite> userLinks = new HashSet<>();

    @OneToMany(mappedBy = "site", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<SiteProject> projects = new HashSet<>();

    @PrePersist @PreUpdate
    void normalize() {
        if (siteName != null) siteName = siteName.trim();
        if (hostPart != null) hostPart = hostPart.trim();
        if (baseUrl  != null) baseUrl  = SiteURLUtility.normalizeURL(baseUrl);
        if (jiraUsername != null) jiraUsername = jiraUsername.trim();
    }
}
