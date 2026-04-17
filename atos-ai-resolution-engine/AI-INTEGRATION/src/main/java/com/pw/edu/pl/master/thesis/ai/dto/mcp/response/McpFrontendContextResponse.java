package com.pw.edu.pl.master.thesis.ai.dto.mcp.response;

import com.pw.edu.pl.master.thesis.ai.dto.site.SiteResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class McpFrontendContextResponse {
    private McpServerConfigResponse activeConfiguration;
    private List<SiteResponse> sites;
}
