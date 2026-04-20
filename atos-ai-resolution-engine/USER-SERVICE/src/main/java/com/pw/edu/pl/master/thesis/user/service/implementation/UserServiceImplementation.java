package com.pw.edu.pl.master.thesis.user.service.implementation;

import com.pw.edu.pl.master.thesis.user.configuration.AuthContext;
import com.pw.edu.pl.master.thesis.user.configuration.JiraClientConfiguration;
import com.pw.edu.pl.master.thesis.user.dto.user.JiraUserMeResponse;
import com.pw.edu.pl.master.thesis.user.dto.user.LoginRequest;
import com.pw.edu.pl.master.thesis.user.dto.user.LoginResponse;
import com.pw.edu.pl.master.thesis.user.dto.user.RegisterUserRequest;
import com.pw.edu.pl.master.thesis.user.dto.user.UserRequest;
import com.pw.edu.pl.master.thesis.user.dto.user.UserSummary;
import com.pw.edu.pl.master.thesis.user.enums.JiraApiEndpoint;
import com.pw.edu.pl.master.thesis.user.enums.Role;
import com.pw.edu.pl.master.thesis.user.exception.InvalidCredentialsException;
import com.pw.edu.pl.master.thesis.user.exception.ResourceNotFoundException;
import com.pw.edu.pl.master.thesis.user.exception.UserAlreadyExistException;
import com.pw.edu.pl.master.thesis.user.exception.UserNotFoundException;
import com.pw.edu.pl.master.thesis.user.mapper.UserMapper;
import com.pw.edu.pl.master.thesis.user.model.helper.JiraUrlBuilder;
import com.pw.edu.pl.master.thesis.user.model.user.AppUser;
import com.pw.edu.pl.master.thesis.user.model.user.User;
import com.pw.edu.pl.master.thesis.user.model.site.Site;
import com.pw.edu.pl.master.thesis.user.model.site.UserSite;
import com.pw.edu.pl.master.thesis.user.model.user.AppUser;
import com.pw.edu.pl.master.thesis.user.repository.SiteRepository;
import com.pw.edu.pl.master.thesis.user.repository.AppUserRepository;
import com.pw.edu.pl.master.thesis.user.repository.UserRepository;
import com.pw.edu.pl.master.thesis.user.repository.UserSiteRepository;
import com.pw.edu.pl.master.thesis.user.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImplementation implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final EncryptionService encryptionService;
    private final SiteRepository siteRepository;
    private final UserSiteRepository userSiteRepository;
    private final JiraClientConfiguration jiraClientConfiguration;
    private final JiraUrlBuilder jiraUrlBuilder;
    private final AppUserService appUserService;
    private final AppUserRepository appUserRepository;
    private final AuthContext auth;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    /* ---------------------------------------------------------------------
     * REGISTER (public)
     * ------------------------------------------------------------------- */
    @Override
    @Transactional

    public UserSummary registerUser(RegisterUserRequest request) {
        return createUserInternal(request, false);
    }

    @Override
    @Transactional
    public UserSummary createUserByAdmin(RegisterUserRequest request) {
        assertCurrentUserHasRole(Role.ADMIN);
        return createUserInternal(request, true);
    }

    /* ---------------------------------------------------------------------
     * LOGIN (public)
     * ------------------------------------------------------------------- */
    @Override
    @Transactional(readOnly = true)
    public LoginResponse userLogin(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        if (!encryptionService.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }
        return LoginResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .accountId(user.getAccountId())
                .displayName(user.getDisplayName())
                .emailAddress(user.getEmailAddress())
                .username(user.getUsername())
                .roles(user.getRoles() == null ? List.of() : user.getRoles().stream().map(Enum::name).toList())
                .isActive(user.isActive())
                .token(jwtService.generateToken(user))
                .tokenType("Bearer")
                .expiresInMs(jwtService.getExpirationMs())
                .build();
    }

    /* ---------------------------------------------------------------------
     * Uses Basic-auth identity instead of username param
     * ------------------------------------------------------------------- */
    @Override
    public String verifyAccountId(String leadAccountId, String jiraBaseUrl, String jiraPlainToken, String ignoredUsernameParam) {
        String currentUsername = auth.currentUsernameOrThrow();
        if (leadAccountId != null && !leadAccountId.isBlank()) return leadAccountId;

        String normalizedBaseUrl = jiraUrlBuilder.normalizeJiraBaseUrl(jiraBaseUrl);
        Site site = findAssignedSiteForCurrentUser(normalizedBaseUrl, currentUsername);
        String tokenPlain = encryptionService.decrypt(site.getJiraToken()).getResult();

        String meUrl = jiraUrlBuilder.url(normalizedBaseUrl, JiraApiEndpoint.ME);
        JiraUserMeResponse meResponse = jiraClientConfiguration.get(
                meUrl, JiraUserMeResponse.class, site.getJiraUsername(), tokenPlain);

        if (meResponse == null || meResponse.getAccountId() == null || meResponse.getAccountId().isBlank()) {
            throw new IllegalStateException("Unable to resolve leadAccountId from Jira /myself.");
        }
        return meResponse.getAccountId();
    }

    @Override
    public UserSummary findByUsername(String username) {
        String resolvedUsername = (username == null || username.isBlank())
                ? auth.currentUsernameOrThrow()
                : username;
        User user = userRepository.findByUsername(resolvedUsername)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + resolvedUsername));
        return toUserSummaryWithSites(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getRoleNamesByUsername(String ignoredParam) {
        String currentUsername = auth.currentUsernameOrThrow();
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));
        Set<Role> roles = user.getRoles();
        if (roles == null) return List.of();
        return roles.stream().map(Enum::name).toList();
    }

    @Override
    @Transactional
    public String deleteUserAndCredentials(String ignoredParam) {
        String currentUsername = auth.currentUsernameOrThrow();

        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        String username = user.getUsername();
        userRepository.delete(user);
        appUserRepository.findByUsername(username).ifPresent(appUserRepository::delete);
        return "User deleted";
    }

    @Override
    @Transactional
    public String deleteUserById(Long id) {
        assertCurrentUserHasRole(Role.ADMIN);
        User user = findUserById(id);
        String username = user.getUsername();
        userRepository.delete(user);
        appUserRepository.findByUsername(username).ifPresent(appUserRepository::delete);
        return "User deleted";
    }

    /* ---------------------------------------------------------------------
     * Basic lookups / CRUD (unchanged behavior, no username params)
     * ------------------------------------------------------------------- */
    @Override
    @Transactional(readOnly = true)
    public UserSummary getUserById(Long id) {
        return toUserSummaryWithSites(findUserById(id));
    }

    @Override
    @Transactional(readOnly = true)
    public User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummary> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserSummaryWithSites)
                .toList();
    }

    @Override
    public Optional<User> findByJiraAccountId(String accountId) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public UserSummary updateUser(Long id, UserRequest request) {
        User existing = findUserById(id);
        String originalUsername = existing.getUsername();

        if (request.getFirstName() != null && !Objects.equals(request.getFirstName(), existing.getFirstName()))
            existing.setFirstName(request.getFirstName());

        if (request.getLastName() != null && !Objects.equals(request.getLastName(), existing.getLastName()))
            existing.setLastName(request.getLastName());

        if (request.getUserName() != null && !Objects.equals(request.getUserName(), existing.getUsername())) {
            userRepository.findByUsername(request.getUserName()).ifPresent(u -> {
                throw new UserAlreadyExistException("Username already in use: " + request.getUserName());
            });
            existing.setUsername(request.getUserName());
        }

        if (request.getEmailAddress() != null && !Objects.equals(request.getEmailAddress(), existing.getEmailAddress())) {
            userRepository.findByEmailAddress(request.getEmailAddress()).ifPresent(u -> {
                throw new UserAlreadyExistException("Email already in use: " + request.getEmailAddress());
            });
            existing.setEmailAddress(request.getEmailAddress());
        }

        if (request.getIsActive() != null) existing.setActive(request.getIsActive());
        if (request.getPassword() != null) existing.setPassword(encryptionService.hashPassword(request.getPassword()));
        existing.setDisplayName(buildDisplayName(existing.getFirstName(), existing.getLastName(), existing.getUsername()));

        try {
            existing = userRepository.saveAndFlush(existing);
        } catch (DataIntegrityViolationException ex) {
            throw new UserAlreadyExistException("Update failed: " + ex.getMostSpecificCause().getMessage());
        }

        syncAssignedSites(existing, request.getSiteIds());
        syncAppUser(existing, originalUsername, request.getPassword());
        return toUserSummaryWithSites(existing);
    }

    @Override
    @Transactional
    public UserSummary updateUser(User userInput) {
        if (userInput.getId() == null) throw new IllegalArgumentException("User ID required");

        User existing = findUserById(userInput.getId());
        String originalUsername = existing.getUsername();
        if (userInput.getUsername() != null)     existing.setUsername(userInput.getUsername());
        if (userInput.getEmailAddress() != null) existing.setEmailAddress(userInput.getEmailAddress());
        if (userInput.getFirstName() != null)    existing.setFirstName(userInput.getFirstName());
        if (userInput.getLastName() != null)     existing.setLastName(userInput.getLastName());
        if (userInput.getPhoneNumber() != null)  existing.setPhoneNumber(userInput.getPhoneNumber());
        existing.setActive(userInput.isActive());
        if (userInput.getPassword() != null)     existing.setPassword(encryptionService.hashPassword(userInput.getPassword()));
        existing.setDisplayName(buildDisplayName(existing.getFirstName(), existing.getLastName(), existing.getUsername()));

        User saved = userRepository.saveAndFlush(existing);
        syncAppUser(saved, originalUsername, userInput.getPassword());
        return toUserSummaryWithSites(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummary findByAccountId(String accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with accountId: " + accountId));
        return userMapper.toUserSummary(user);
    }

    @Override
    @Transactional
    public User saveAndFlushUser(User user) {
        return userRepository.saveAndFlush(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllRoleNames() {
        return Arrays.stream(Role.values()).map(Enum::name).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmailAddress(String emailAddress) {
        if (emailAddress == null || emailAddress.isBlank()) {
            throw new IllegalArgumentException("Email address cannot be null or empty");
        }
        return userRepository.existsByEmailAddress(emailAddress);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Username cannot be null or empty");
        }
        return userRepository.existsByUsername(username);
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummary findByEmailAddress(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null or blank");
        }

        return userRepository.findByEmailAddress(email)
                .map(userMapper::toUserSummary)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    /* ----------------------- helpers ----------------------- */
    private Role parseRole(String role) {
        String userRole = role.trim().replace('-', '_').replace(' ', '_').toUpperCase(Locale.ROOT);
        try { return Role.valueOf(userRole); }
        catch (IllegalArgumentException e) { throw new IllegalArgumentException("Unknown role: " + role); }
    }

    private UserSummary createUserInternal(RegisterUserRequest request, boolean allowRequestedRoles) {
        validateRegistrationRequest(request);

        if (existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistException("Username already taken");
        }
        if (existsByEmailAddress(request.getEmailAddress())) {
            throw new UserAlreadyExistException("Email already registered");
        }

        Set<Role> roles = allowRequestedRoles
                ? parseRequestedRoles(request.getRoles())
                : Set.of(Role.USER);
        String appRoles = roles.stream().map(Enum::name).collect(Collectors.joining(","));

        AppUser appUser = appUserService.register(request.getUsername(), request.getPassword(), appRoles);

        User user = User.builder()
                .username(request.getUsername())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .password(encryptionService.hashPassword(request.getPassword()))
                .emailAddress(request.getEmailAddress())
                .phoneNumber(request.getPhoneNumber())
                .displayName(buildDisplayName(request.getFirstName(), request.getLastName(), request.getUsername()))
                .accountId(buildAccountId(request.getUsername()))
                .isActive(true)
                .roles(roles)
                .build();
        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            throw new UserAlreadyExistException("Registration failed: " + ex.getMostSpecificCause().getMessage());
        }

        assignSitesIfRequested(user, request.getSiteIds(), allowRequestedRoles);

        log.info("Created application user {} with roles {}", appUser.getUsername(), appRoles);
        return toUserSummaryWithSites(user);
    }

    private Set<Role> parseRequestedRoles(List<String> rawRoles) {
        if (rawRoles == null || rawRoles.isEmpty()) {
            return Set.of(Role.USER);
        }
        return rawRoles.stream()
                .filter(Objects::nonNull)
                .map(this::parseRole)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private void validateRegistrationRequest(RegisterUserRequest request) {
        if (request == null) throw new IllegalArgumentException("request is required");
        if (request.getUsername() == null || request.getUsername().isBlank())
            throw new IllegalArgumentException("username is required");
        if (request.getPassword() == null || request.getPassword().isBlank())
            throw new IllegalArgumentException("password is required");
        if (request.getFirstName() == null || request.getFirstName().isBlank())
            throw new IllegalArgumentException("firstName is required");
        if (request.getLastName() == null || request.getLastName().isBlank())
            throw new IllegalArgumentException("lastName is required");
        if (request.getEmailAddress() == null || request.getEmailAddress().isBlank())
            throw new IllegalArgumentException("emailAddress is required");
    }

    private void assertCurrentUserHasRole(Role requiredRole) {
        String currentUsername = auth.currentUsernameOrThrow();
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));
        if (user.getRoles() == null || !user.getRoles().contains(requiredRole)) {
            throw new InvalidCredentialsException("Admin role required");
        }
    }

    private Site findAssignedSiteForCurrentUser(String normalizedBaseUrl, String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        return userSiteRepository.findByUserId(user.getId()).stream()
                .map(UserSite::getSite)
                .filter(Objects::nonNull)
                .filter(site -> normalizedBaseUrl.equalsIgnoreCase(site.getBaseUrl()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No Jira site assigned for baseUrl: " + normalizedBaseUrl));
    }

    private String buildDisplayName(String firstName, String lastName, String username) {
        String fullName = ((firstName == null ? "" : firstName.trim()) + " " +
                (lastName == null ? "" : lastName.trim())).trim();
        return fullName.isBlank() ? username : fullName;
    }

    private void assignSitesIfRequested(User user, List<Long> siteIds, boolean allowRequestedRoles) {
        if (!allowRequestedRoles || siteIds == null || siteIds.isEmpty()) {
            return;
        }

        LinkedHashSet<Long> uniqueSiteIds = siteIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        boolean defaultAssigned = false;
        for (Long siteId : uniqueSiteIds) {
            Site site = siteRepository.findById(siteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Site not found with id: " + siteId));

            if (userSiteRepository.existsByUserIdAndSiteId(user.getId(), site.getId())) {
                continue;
            }

            userSiteRepository.save(UserSite.builder()
                    .user(user)
                    .site(site)
                    .defaultForUser(!defaultAssigned)
                    .build());
            defaultAssigned = true;
        }
    }

    private void syncAssignedSites(User user, List<Long> siteIds) {
        if (siteIds == null) {
            return;
        }

        LinkedHashSet<Long> requestedSiteIds = siteIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<UserSite> existingLinks = userSiteRepository.findByUserId(user.getId());
        for (UserSite link : existingLinks) {
            Long linkedSiteId = link.getSite() != null ? link.getSite().getId() : null;
            if (linkedSiteId != null && !requestedSiteIds.contains(linkedSiteId)) {
                userSiteRepository.delete(link);
            }
        }

        boolean defaultAssigned = userSiteRepository.findByUserId(user.getId()).stream()
                .anyMatch(link -> Boolean.TRUE.equals(link.getDefaultForUser()));

        for (Long siteId : requestedSiteIds) {
            Site site = siteRepository.findById(siteId)
                    .orElseThrow(() -> new ResourceNotFoundException("Site not found with id: " + siteId));

            if (userSiteRepository.existsByUserIdAndSiteId(user.getId(), site.getId())) {
                continue;
            }

            userSiteRepository.save(UserSite.builder()
                    .user(user)
                    .site(site)
                    .defaultForUser(!defaultAssigned)
                    .build());
            defaultAssigned = true;
        }
    }

    private List<Long> getAssignedSiteIds(Long userId) {
        return userSiteRepository.findByUserId(userId).stream()
                .map(UserSite::getSite)
                .filter(Objects::nonNull)
                .map(Site::getId)
                .toList();
    }

    private UserSummary toUserSummaryWithSites(User user) {
        UserSummary summary = userMapper.toUserSummary(user);
        summary.setSiteIds(getAssignedSiteIds(user.getId()));
        return summary;
    }

    private String buildAccountId(String username) {
        return "usr-" + username.trim().toLowerCase(Locale.ROOT).replace("@", "-at-");
    }

    private void syncAppUser(User user, String originalUsername, String rawPassword) {
        String lookupUsername = (originalUsername == null || originalUsername.isBlank())
                ? user.getUsername()
                : originalUsername;
        AppUser appUser = appUserRepository.findByUsername(lookupUsername)
                .orElseGet(AppUser::new);
        appUser.setUsername(user.getUsername());
        if (rawPassword != null && !rawPassword.isBlank()) {
            appUser.setPassword(passwordEncoder.encode(rawPassword));
        } else if (appUser.getPassword() == null || appUser.getPassword().isBlank()) {
            appUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        }
        appUser.setRoles(user.getRoles() == null || user.getRoles().isEmpty()
                ? Role.USER.name()
                : user.getRoles().stream().map(Enum::name).collect(Collectors.joining(",")));
        appUserRepository.save(appUser);
    }
}
