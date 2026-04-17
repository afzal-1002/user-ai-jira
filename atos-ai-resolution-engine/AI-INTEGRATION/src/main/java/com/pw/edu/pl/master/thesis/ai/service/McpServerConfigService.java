package com.pw.edu.pl.master.thesis.ai.service;

import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.CreateMcpServerConfigRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.UpdateMcpServerConfigRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpServerConfigResponse;
import com.pw.edu.pl.master.thesis.ai.model.McpServerConfig;

import java.util.List;

public interface McpServerConfigService {

    McpServerConfigResponse create(CreateMcpServerConfigRequest request);

    McpServerConfigResponse update(Long id, UpdateMcpServerConfigRequest request);

    McpServerConfigResponse getById(Long id);

    List<McpServerConfigResponse> getAll();

    McpServerConfigResponse getActive();

    McpServerConfig getActiveEntity();
}
