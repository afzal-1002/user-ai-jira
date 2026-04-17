package com.pw.edu.pl.master.thesis.ai.configuration;


import com.pw.edu.pl.master.thesis.ai.client.user.CredentialClient;
import com.pw.edu.pl.master.thesis.ai.dto.credentials.UserCredentialResponse;
import com.pw.edu.pl.master.thesis.ai.dto.helper.JiraUrlBuilder;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
@RequiredArgsConstructor
@Data @Getter
@Setter
public class RequestCredentials {

    private final CredentialClient credentialClient;
    private final JiraUrlBuilder jiraUrlBuilder;
    private final HttpServletRequest request;

    private String baseUrl;
    private String username;
    private String token;

    @PostConstruct
    void init() {
        UserCredentialResponse raw = credentialClient.getResolvedForCurrentUser(resolveSiteId(), null);
        if (raw == null || isBlank(raw.getBaseUrl()) || isBlank(raw.getUsername()) || isBlank(raw.getToken())) {
            throw new IllegalStateException("Missing Jira credential (username/baseUrl/token) for current user");
        }
        this.baseUrl = jiraUrlBuilder.normalizeJiraBaseUrl(raw.getBaseUrl());
        this.username = raw.getUsername();
        this.token = raw.getToken();
    }

    public String baseUrl() { return baseUrl; }
    public String username() { return username; }
    public String token() { return token; }

    private static boolean isBlank(String string) { return string == null || string.isBlank(); }

    private Long resolveSiteId() {
        String raw = request.getHeader("X-Site-Id");
        if (isBlank(raw)) {
            raw = request.getParameter("siteId");
        }
        if (isBlank(raw)) {
            return null;
        }
        try {
            return Long.valueOf(raw.trim());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("X-Site-Id/siteId must be numeric");
        }
    }
}
