package com.pw.edu.pl.master.thesis.ai.service.implementation;

import com.pw.edu.pl.master.thesis.ai.configuration.GitHubProperties;
import com.pw.edu.pl.master.thesis.ai.dto.github.GitHubFileData;
import com.pw.edu.pl.master.thesis.ai.exception.ValidationException;
import com.pw.edu.pl.master.thesis.ai.service.GitHubService;
import lombok.RequiredArgsConstructor;
import org.kohsuke.github.GHContent;
import org.kohsuke.github.GHPullRequest;
import org.kohsuke.github.GHRef;
import org.kohsuke.github.GHRepository;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GitHubServiceImplementation implements GitHubService {

    private final GitHubProperties properties;

    @Override
    public String createBranch(String repoName, String baseBranch, String newBranch) throws IOException {
        GHRepository repo = getRepo(repoName);
        GHRef baseRef = repo.getRef("heads/" + baseBranch);
        repo.createRef("refs/heads/" + newBranch, baseRef.getObject().getSha());
        return newBranch;
    }

    @Override
    public GitHubFileData getFile(String repoName, String branch, String filePath) throws IOException {
        GHRepository repo = getRepo(repoName);
        GHContent file = repo.getFileContent(filePath, branch);
        try (InputStream inputStream = file.read()) {
            return GitHubFileData.builder()
                    .path(filePath)
                    .sha(file.getSha())
                    .content(new String(inputStream.readAllBytes(), StandardCharsets.UTF_8))
                    .build();
        }
    }

    @Override
    public void updateFile(String repoName, String branch, String filePath, String newContent, String commitMessage) throws IOException {
        GHRepository repo = getRepo(repoName);
        GHContent file = repo.getFileContent(filePath, branch);
        repo.createContent()
                .content(newContent)
                .path(filePath)
                .message(commitMessage)
                .sha(file.getSha())
                .branch(branch)
                .commit();
    }

    @Override
    public String createPullRequest(String repoName, String branch, String baseBranch, String title, String description) throws IOException {
        GHRepository repo = getRepo(repoName);
        GHPullRequest pullRequest = repo.createPullRequest(title, branch, baseBranch, description);
        return pullRequest.getHtmlUrl().toString();
    }

    @Override
    public List<String> listRepositoryFiles(String repoName, String branch) throws IOException {
        GHRepository repo = getRepo(repoName);
        List<String> files = new ArrayList<>();
        Deque<String> directories = new ArrayDeque<>();
        directories.push("");

        while (!directories.isEmpty()) {
            String currentDir = directories.pop();
            List<GHContent> contents = repo.getDirectoryContent(currentDir, branch);
            for (GHContent content : contents) {
                if ("dir".equalsIgnoreCase(content.getType())) {
                    directories.push(content.getPath());
                } else if ("file".equalsIgnoreCase(content.getType())) {
                    files.add(content.getPath());
                }
            }
        }

        return files;
    }

    private GHRepository getRepo(String repoName) throws IOException {
        String effectiveRepo = (repoName == null || repoName.isBlank()) ? properties.getRepo() : repoName.trim();
        if (effectiveRepo == null || effectiveRepo.isBlank()) {
            throw new ValidationException("GitHub repository is not configured");
        }
        return buildClient().getRepository(effectiveRepo);
    }

    private GitHub buildClient() throws IOException {
        if (properties.getToken() == null || properties.getToken().isBlank()) {
            throw new ValidationException("GitHub token is not configured");
        }
        return new GitHubBuilder()
                .withOAuthToken(properties.getToken())
                .build();
    }
}
