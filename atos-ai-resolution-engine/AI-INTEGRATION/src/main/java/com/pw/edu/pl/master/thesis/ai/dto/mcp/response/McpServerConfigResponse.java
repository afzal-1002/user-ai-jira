package com.pw.edu.pl.master.thesis.ai.dto.mcp.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class McpServerConfigResponse {
    private Long id;
    private String serverName;
    private String serverVersion;
    private String transportType;
    private String defaultProjectKey;
    private Integer defaultMaxResults;
    private String instructions;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
