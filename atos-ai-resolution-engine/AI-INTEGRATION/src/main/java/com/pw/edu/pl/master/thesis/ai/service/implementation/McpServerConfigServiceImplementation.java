package com.pw.edu.pl.master.thesis.ai.service.implementation;

import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.CreateMcpServerConfigRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.UpdateMcpServerConfigRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpServerConfigResponse;
import com.pw.edu.pl.master.thesis.ai.exception.ResourceNotFoundException;
import com.pw.edu.pl.master.thesis.ai.exception.ValidationException;
import com.pw.edu.pl.master.thesis.ai.mapper.McpServerConfigMapper;
import com.pw.edu.pl.master.thesis.ai.model.McpServerConfig;
import com.pw.edu.pl.master.thesis.ai.repository.McpServerConfigRepository;
import com.pw.edu.pl.master.thesis.ai.service.McpServerConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class McpServerConfigServiceImplementation implements McpServerConfigService {

    private static final Set<String> SUPPORTED_TRANSPORTS = Set.of("SSE", "STREAMABLE", "STATELESS");

    private final McpServerConfigRepository repository;
    private final McpServerConfigMapper mapper;

    @Override
    @Transactional
    public McpServerConfigResponse create(CreateMcpServerConfigRequest request) {
        validate(request.getServerName(), request.getTransportType(), request.getDefaultMaxResults());

        McpServerConfig entity = mapper.toEntity(request);
        if (Boolean.TRUE.equals(entity.getEnabled())) {
            disableOtherActiveConfigurations(null);
        }

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional
    public McpServerConfigResponse update(Long id, UpdateMcpServerConfigRequest request) {
        validate(request.getServerName(), request.getTransportType(), request.getDefaultMaxResults());

        McpServerConfig entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MCP server configuration not found with id: " + id));

        mapper.updateEntity(entity, request);
        if (Boolean.TRUE.equals(entity.getEnabled())) {
            disableOtherActiveConfigurations(id);
        }

        return mapper.toResponse(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public McpServerConfigResponse getById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MCP server configuration not found with id: " + id)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<McpServerConfigResponse> getAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public McpServerConfigResponse getActive() {
        return mapper.toResponse(getActiveEntity());
    }

    @Override
    @Transactional(readOnly = true)
    public McpServerConfig getActiveEntity() {
        return repository.findFirstByEnabledTrueOrderByUpdatedAtDesc()
                .orElseThrow(() -> new ResourceNotFoundException("No active MCP server configuration found"));
    }

    private void validate(String serverName, String transportType, Integer defaultMaxResults) {
        if (serverName == null || serverName.trim().isEmpty()) {
            throw new ValidationException("serverName is required");
        }

        if (transportType == null || transportType.trim().isEmpty()) {
            throw new ValidationException("transportType is required");
        }

        String normalizedTransport = transportType.trim().toUpperCase();
        if (!SUPPORTED_TRANSPORTS.contains(normalizedTransport)) {
            throw new ValidationException("transportType must be one of: " + SUPPORTED_TRANSPORTS);
        }

        if (defaultMaxResults != null && defaultMaxResults <= 0) {
            throw new ValidationException("defaultMaxResults must be greater than zero");
        }
    }

    private void disableOtherActiveConfigurations(Long currentId) {
        List<McpServerConfig> activeConfigurations = currentId == null
                ? repository.findAllByEnabledTrue()
                : repository.findAllByEnabledTrueAndIdNot(currentId);

        activeConfigurations.forEach(config -> config.setEnabled(false));
        repository.saveAll(activeConfigurations);
    }
}
