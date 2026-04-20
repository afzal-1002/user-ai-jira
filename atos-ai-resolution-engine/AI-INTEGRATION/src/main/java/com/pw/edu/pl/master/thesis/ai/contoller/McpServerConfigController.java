package com.pw.edu.pl.master.thesis.ai.contoller;

import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.CreateMcpServerConfigRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.UpdateMcpServerConfigRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpServerConfigResponse;
import com.pw.edu.pl.master.thesis.ai.service.McpServerConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wut/mcp/configurations")
@RequiredArgsConstructor
public class McpServerConfigController {

    private final McpServerConfigService service;

    @PostMapping
    public McpServerConfigResponse create(@RequestBody CreateMcpServerConfigRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public McpServerConfigResponse update(@PathVariable Long id,
                                          @RequestBody UpdateMcpServerConfigRequest request) {
        return service.update(id, request);
    }

    @GetMapping("/{id}")
    public McpServerConfigResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<McpServerConfigResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/active")
    public McpServerConfigResponse getActive() {
        return service.getActive();
    }
}
