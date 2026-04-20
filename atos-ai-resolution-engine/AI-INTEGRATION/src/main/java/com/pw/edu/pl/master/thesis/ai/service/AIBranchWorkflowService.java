package com.pw.edu.pl.master.thesis.ai.service;

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

public interface AIBranchWorkflowService {
    BranchSessionResponse startSession(StartBranchSessionRequest request);
    AnalyzeRepoBugResponse analyzeRepoBug(AnalyzeRepoBugRequest request);
    FixBugResponse fixBug(FixBugRequest request);
    PreviewFixResponse previewFix(PreviewFixRequest request);
    AutoFixResponse applyFix(ApplyFixRequest request);
    AutoFixResponse autoFix(AutoFixRequest request);
    BranchSessionResponse sendForReview(SendReviewRequest request);
    BranchSessionResponse getSession(String sessionId);
}
