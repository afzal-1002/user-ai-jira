package com.pw.edu.pl.master.thesis.ai.service;

import com.pw.edu.pl.master.thesis.ai.dto.github.BranchSessionResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.FixBugRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.FixBugResponse;
import com.pw.edu.pl.master.thesis.ai.dto.github.SendReviewRequest;
import com.pw.edu.pl.master.thesis.ai.dto.github.StartBranchSessionRequest;

public interface AIBranchWorkflowService {
    BranchSessionResponse startSession(StartBranchSessionRequest request);
    FixBugResponse fixBug(FixBugRequest request);
    BranchSessionResponse sendForReview(SendReviewRequest request);
    BranchSessionResponse getSession(String sessionId);
}
