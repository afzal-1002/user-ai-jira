package com.pw.edu.pl.master.thesis.ai.dto.mcp.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMcpServerConfigRequest {
    private String serverName;
    private String serverVersion;
    private String transportType;
    private String defaultProjectKey;
    private Integer defaultMaxResults;
    private String instructions;
    private Boolean enabled;
}
