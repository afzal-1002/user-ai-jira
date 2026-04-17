package com.pw.edu.pl.master.thesis.ai.service.implementation;

import com.pw.edu.pl.master.thesis.ai.enums.BranchSessionStatus;
import com.pw.edu.pl.master.thesis.ai.exception.CustomException;
import com.pw.edu.pl.master.thesis.ai.model.github.BranchSession;
import com.pw.edu.pl.master.thesis.ai.service.BranchSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BranchSessionServiceImplementation implements BranchSessionService {

    private final Map<String, BranchSession> sessions = new ConcurrentHashMap<>();

    @Override
    public BranchSession create(String repoName, String baseBranch, String branchName, List<String> bugs) {
        OffsetDateTime now = OffsetDateTime.now();
        BranchSession session = BranchSession.builder()
                .sessionId(UUID.randomUUID().toString())
                .repoName(repoName)
                .baseBranch(baseBranch)
                .branchName(branchName)
                .status(BranchSessionStatus.OPEN)
                .bugs(bugs == null ? new ArrayList<>() : new ArrayList<>(bugs))
                .createdAt(now)
                .updatedAt(now)
                .build();
        sessions.put(session.getSessionId(), session);
        return session;
    }

    @Override
    public BranchSession get(String sessionId) {
        BranchSession session = sessions.get(sessionId);
        if (session == null) {
            throw new CustomException("Branch session not found: " + sessionId, HttpStatus.NOT_FOUND);
        }
        return session;
    }

    @Override
    public BranchSession save(BranchSession session) {
        sessions.put(session.getSessionId(), session);
        return session;
    }
}
