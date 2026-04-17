package com.pw.edu.pl.master.thesis.ai.service;

import com.pw.edu.pl.master.thesis.ai.model.github.BranchSession;

import java.util.List;

public interface BranchSessionService {
    BranchSession create(String repoName, String baseBranch, String branchName, List<String> bugs);
    BranchSession get(String sessionId);
    BranchSession save(BranchSession session);
}
