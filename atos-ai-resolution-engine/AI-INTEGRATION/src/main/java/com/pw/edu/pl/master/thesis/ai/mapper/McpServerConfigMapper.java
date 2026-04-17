package com.pw.edu.pl.master.thesis.ai.mapper;

import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.CreateMcpServerConfigRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.UpdateMcpServerConfigRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpServerConfigResponse;
import com.pw.edu.pl.master.thesis.ai.model.McpServerConfig;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class McpServerConfigMapper {

    public McpServerConfig toEntity(CreateMcpServerConfigRequest request) {
        return McpServerConfig.builder()
                .serverName(trim(request.getServerName()))
                .serverVersion(defaultVersion(request.getServerVersion()))
                .transportType(normalizeTransport(request.getTransportType()))
                .defaultProjectKey(trimToNull(request.getDefaultProjectKey()))
                .defaultMaxResults(defaultMaxResults(request.getDefaultMaxResults()))
                .instructions(trimToNull(request.getInstructions()))
                .enabled(Boolean.TRUE.equals(request.getEnabled()))
                .build();
    }

    public void updateEntity(McpServerConfig entity, UpdateMcpServerConfigRequest request) {
        entity.setServerName(trim(request.getServerName()));
        entity.setServerVersion(defaultVersion(request.getServerVersion()));
        entity.setTransportType(normalizeTransport(request.getTransportType()));
        entity.setDefaultProjectKey(trimToNull(request.getDefaultProjectKey()));
        entity.setDefaultMaxResults(defaultMaxResults(request.getDefaultMaxResults()));
        entity.setInstructions(trimToNull(request.getInstructions()));
        entity.setEnabled(Boolean.TRUE.equals(request.getEnabled()));
    }

    public McpServerConfigResponse toResponse(McpServerConfig entity) {
        return McpServerConfigResponse.builder()
                .id(entity.getId())
                .serverName(entity.getServerName())
                .serverVersion(entity.getServerVersion())
                .transportType(entity.getTransportType())
                .defaultProjectKey(entity.getDefaultProjectKey())
                .defaultMaxResults(entity.getDefaultMaxResults())
                .instructions(entity.getInstructions())
                .enabled(entity.getEnabled())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String normalizeTransport(String transportType) {
        return trim(transportType).toUpperCase(Locale.ROOT);
    }

    private String defaultVersion(String version) {
        String normalized = trimToNull(version);
        return normalized == null ? "1.0.0" : normalized;
    }

    private Integer defaultMaxResults(Integer maxResults) {
        return maxResults == null ? 10 : maxResults;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String trimToNull(String value) {
        String trimmed = trim(value);
        return trimmed == null || trimmed.isEmpty() ? null : trimmed;
    }
}
