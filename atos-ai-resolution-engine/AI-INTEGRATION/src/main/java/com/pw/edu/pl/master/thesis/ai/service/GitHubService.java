package com.pw.edu.pl.master.thesis.ai.service;

import com.pw.edu.pl.master.thesis.ai.dto.github.GitHubFileData;

import java.io.IOException;
import java.util.List;

public interface GitHubService {
    String createBranch(String repoName, String baseBranch, String newBranch) throws IOException;
    GitHubFileData getFile(String repoName, String branch, String filePath) throws IOException;
    void updateFile(String repoName, String branch, String filePath, String newContent, String commitMessage) throws IOException;
    String createPullRequest(String repoName, String branch, String baseBranch, String title, String description) throws IOException;
    List<String> listRepositoryFiles(String repoName, String branch) throws IOException;
}
