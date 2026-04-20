package com.pw.edu.pl.master.thesis.ai.contoller;

import com.pw.edu.pl.master.thesis.ai.dto.github.AnalyzeRepoBugRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.AnalyzeRepoBugResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.ApplyFixRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.BranchSessionResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.AutoFixRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.AutoFixResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.FixBugRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.FixBugResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.PreviewFixRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.PreviewFixResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.SendReviewRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.StartBranchSessionRequest;
import com.pw.edu.pl.master.thesis.ai.service.AIBranchWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wut/ai")
@RequiredArgsConstructor
public class AIBranchWorkflowController {

    private final AIBranchWorkflowService aiBranchWorkflowService;

    @PostMapping("/start-session")
    public BranchSessionResponse startSession(@RequestBody(required = false) StartBranchSessionRequest request) {
        return aiBranchWorkflowService.startSession(request);
    }

    @PostMapping({"/analyze-repo-bug", "/analyze-repo"})
    public AnalyzeRepoBugResponse analyzeRepoBug(@RequestBody AnalyzeRepoBugRequest request) {
        return aiBranchWorkflowService.analyzeRepoBug(request);
    }

    @PostMapping("/fix-bug")
    public FixBugResponse fixBug(@RequestBody FixBugRequest request) {
        return aiBranchWorkflowService.fixBug(request);
    }

    @PostMapping("/preview-fix")
    public PreviewFixResponse previewFix(@RequestBody PreviewFixRequest request) {
        return aiBranchWorkflowService.previewFix(request);
    }

    @PostMapping("/apply-fix")
    public AutoFixResponse applyFix(@RequestBody ApplyFixRequest request) {
        return aiBranchWorkflowService.applyFix(request);
    }

    @PostMapping("/auto-fix")
    public AutoFixResponse autoFix(@RequestBody AutoFixRequest request) {
        return aiBranchWorkflowService.autoFix(request);
    }

    @PostMapping("/send-review")
    public BranchSessionResponse sendReview(@RequestBody SendReviewRequest request) {
        return aiBranchWorkflowService.sendForReview(request);
    }

    @GetMapping("/sessions/{sessionId}")
    public BranchSessionResponse getSession(@PathVariable String sessionId) {
        return aiBranchWorkflowService.getSession(sessionId);
    }
}
