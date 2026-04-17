package com.pw.edu.pl.master.thesis.user.service.implementation;

import com.pw.edu.pl.master.thesis.user.configuration.JiraClientConfiguration;
import com.pw.edu.pl.master.thesis.user.dto.user.JiraUserMeResponse;
import com.pw.edu.pl.master.thesis.user.dto.user.JiraUserResponse;
import com.pw.edu.pl.master.thesis.user.enums.JiraApiEndpoint;
import com.pw.edu.pl.master.thesis.user.model.helper.HelperMethod;
import com.pw.edu.pl.master.thesis.user.model.helper.JiraUrlBuilder;
import com.pw.edu.pl.master.thesis.user.model.site.Site;
import com.pw.edu.pl.master.thesis.user.model.site.UserSite;
import com.pw.edu.pl.master.thesis.user.model.user.User;
import com.pw.edu.pl.master.thesis.user.model.user.UserCredential;
import com.pw.edu.pl.master.thesis.user.repository.SiteRepository;
import com.pw.edu.pl.master.thesis.user.repository.UserRepository;
import com.pw.edu.pl.master.thesis.user.repository.UserSiteRepository;
import com.pw.edu.pl.master.thesis.user.repository.UserCredentialRepository;
import com.pw.edu.pl.master.thesis.user.service.AppUserService;
import com.pw.edu.pl.master.thesis.user.service.CredentialService;
import com.pw.edu.pl.master.thesis.user.service.EncryptionService;
import com.pw.edu.pl.master.thesis.user.service.JiraUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class JiraUserServiceImplementation implements JiraUserService {

    private final JiraClientConfiguration jiraClientConfiguration;
    private final UserCredentialRepository userCredentialRepository; // still used by "raw" flows where needed
    private final JiraUrlBuilder jiraUrlBuilder;
    private final HelperMethod helperMethod;
    private final EncryptionService encryptionService;
    private final CredentialService credentialService;
    private final AppUserService appUserService;
    private final UserRepository userRepository;
    private final UserSiteRepository userSiteRepository;
    private final SiteRepository siteRepository;

    /** Secured: use Basic-auth user’s stored token to call Jira /myself. */
    @Override
    @Transactional(readOnly = true)
    public JiraUserResponse getMyJiraProfile() {
        Site site = getFirstAssignedSiteOrThrow();
        String baseUrl   = site.getBaseUrl();
        String jiraEmail = site.getJiraUsername();
        String token     = encryptionService.decrypt(site.getJiraToken()).getResult();

        String meUrl = jiraUrlBuilder.url(baseUrl, JiraApiEndpoint.ME);
        return jiraClientConfiguration.get(meUrl, JiraUserResponse.class, jiraEmail, token);
    }

    /**
     * Secured: ignore incoming username; return Jira profile for the CURRENT caller.
     * (Kept signature for compatibility; param is ignored.)
     */
    @Override
    @Transactional(readOnly = true)
    public JiraUserResponse getJiraUserByUsername(String ignoredUsername) {
        Site site = getFirstAssignedSiteOrThrow();
        String baseUrl   = site.getBaseUrl();
        String jiraEmail = site.getJiraUsername();
        String token     = encryptionService.decrypt(site.getJiraToken()).getResult();

        String meUrl = jiraUrlBuilder.url(baseUrl, JiraApiEndpoint.ME);
        return jiraClientConfiguration.get(meUrl, JiraUserResponse.class, jiraEmail, token);
    }

    /**
     * Secured: ignore incoming username; return CURRENT caller’s credential row.
     * (Kept signature for compatibility; param is ignored.)
     */
    @Override
    @Transactional(readOnly = true)
    public UserCredential getJiraCredential(String ignoredUsername) {
        return credentialService.getForCurrentUserOrThrow();
    }

    /**
     * Public helper used during registration or validation BEFORE the user is authenticated.
     * Accepts plain Jira token and email/username explicitly.
     */
    @Override
    @Transactional(readOnly = true)
    public JiraUserResponse getJiraUserDetailsRaw(String baseUrl, String jiraUsername, String plainToken) {
        String meUrl = jiraUrlBuilder.url(baseUrl, JiraApiEndpoint.ME);
        return jiraClientConfiguration.get(meUrl, JiraUserResponse.class, jiraUsername, plainToken);
    }

    /**
     * Public/helper: same as above but accepts an encrypted-or-DB token string (will decrypt).
     * Useful when you already fetched a credential row.
     */
    @Override
    @Transactional(readOnly = true)
    public JiraUserResponse getJiraUserDetails(String baseUrl, String jiraUsername, String encryptedOrDbToken) {
        helperMethod.requireNonBlank(baseUrl, "Jira URL");
        helperMethod.requireNonBlank(jiraUsername, "Jira username");
        helperMethod.requireNonBlank(encryptedOrDbToken, "Jira API token");

        String plain = encryptionService.decrypt(encryptedOrDbToken).getResult();
        String meUrl = jiraUrlBuilder.url(baseUrl, JiraApiEndpoint.ME);
        return jiraClientConfiguration.get(meUrl, JiraUserResponse.class, jiraUsername, plain);
    }

    /**
     * Secured: ignore incoming username; resolve CURRENT caller’s account via Jira /myself.
     * (Kept signature for compatibility; param is ignored.)
     */
    @Override
    @Transactional(readOnly = true)
    public JiraUserMeResponse findJiraUserByUserName(String ignoredUsername) {
        Site site = getFirstAssignedSiteOrThrow();

        String jiraEmail  = site.getJiraUsername();
        String baseUrl    = site.getBaseUrl();
        String plainToken = encryptionService.decrypt(site.getJiraToken()).getResult();

        String meUrl = jiraUrlBuilder.url(baseUrl, JiraApiEndpoint.ME);
        JiraUserMeResponse me =
                jiraClientConfiguration.get(meUrl, JiraUserMeResponse.class, jiraEmail, plainToken);

        if (me == null || me.getAccountId() == null || me.getAccountId().isBlank()) {
            throw new IllegalStateException("Unable to resolve accountId from Jira /myself.");
        }
        return me;
    }

    private Site getFirstAssignedSiteOrThrow() {
        String username = appUserService.getCurrentUsername();
        if (username == null || username.isBlank()) {
            throw new IllegalStateException("Unauthenticated request");
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));

        return userSiteRepository.findByUserId(user.getId()).stream()
                .map(UserSite::getSite)
                .filter(site -> site != null)
                .findFirst()
                .flatMap(site -> siteRepository.findById(site.getId()))
                .orElseThrow(() -> new IllegalStateException("No Jira site assigned for current user"));
    }
}
