package com.pw.edu.pl.master.thesis.ai.contoller;

import com.pw.edu.pl.master.thesis.ai.dto.ai.ChatMessage;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.request.McpGeminiAnalysisRequest;
import com.pw.edu.pl.master.thesis.ai.dto.mcp.response.McpGeminiAnalysisResponse;
import com.pw.edu.pl.master.thesis.ai.service.GeminiService;
import com.pw.edu.pl.master.thesis.ai.service.McpGeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wut/mcp/gemini")
@RequiredArgsConstructor
public class McpGeminiController {

    private final McpGeminiService mcpGeminiService;
    private final GeminiService geminiService;

    @PostMapping("/analyze")
    public ResponseEntity<McpGeminiAnalysisResponse> analyze(@RequestBody McpGeminiAnalysisRequest request) {
        return ResponseEntity.ok(mcpGeminiService.analyzeIssue(request));
    }

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@RequestBody ChatMessage message) {
        return ResponseEntity.ok(geminiService.chat(message));
    }
}
