package com.pw.edu.pl.master.thesis.ai.service;

import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.McpGeminiAnalysisRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpGeminiAnalysisResponse;

public interface McpGeminiService {

    McpGeminiAnalysisResponse analyzeIssue(McpGeminiAnalysisRequest request);
}
