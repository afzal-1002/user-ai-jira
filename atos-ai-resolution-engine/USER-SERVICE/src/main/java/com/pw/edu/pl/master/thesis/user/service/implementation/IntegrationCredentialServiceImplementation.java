package com.pw.edu.pl.master.thesis.user.service.implementation;

import com.pw.edu.pl.master.thesis.user.dto.credentials.CreateIntegrationCredentialRequest;
import com.pw.edu.pl.master.thesis.user.dto.credentials.IntegrationCredentialResponse;
import com.pw.edu.pl.master.thesis.user.dto.credentials.ResolvedIntegrationCredentialResponse;
import com.pw.edu.pl.master.thesis.user.dto.credentials.UpdateIntegrationCredentialRequest;
import com.pw.edu.pl.master.thesis.user.enums.IntegrationCredentialType;
import com.pw.edu.pl.master.thesis.user.exception.ResourceNotFoundException;
import com.pw.edu.pl.master.thesis.user.model.user.AppUser;
import com.pw.edu.pl.master.thesis.user.model.user.IntegrationCredential;
import com.pw.edu.pl.master.thesis.user.repository.AppUserRepository;
import com.pw.edu.pl.master.thesis.user.repository.IntegrationCredentialRepository;
import com.pw.edu.pl.master.thesis.user.service.AppUserService;
import com.pw.edu.pl.master.thesis.user.service.EncryptionService;
import com.pw.edu.pl.master.thesis.user.service.IntegrationCredentialService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IntegrationCredentialServiceImplementation implements IntegrationCredentialService {

    private final IntegrationCredentialRepository integrationCredentialRepository;
    private final AppUserService appUserService;
    private final AppUserRepository appUserRepository;
    private final EncryptionService encryptionService;

    @Override
    @Transactional
    public IntegrationCredentialResponse create(CreateIntegrationCredentialRequest request) {
        validateCreate(request);
        AppUser appUser = currentAppUser();
        ensureUniqueName(appUser.getUsername(), request.getName(), null);

        IntegrationCredential credential = IntegrationCredential.builder()
                .name(request.getName().trim())
                .type(request.getType())
                .username(trimToNull(request.getUsername()))
                .encryptedSecret(encryptSecret(request.getSecret()))
                .secretReference(trimToNull(request.getSecretReference()))
                .appUser(appUser)
                .build();

        return toResponse(integrationCredentialRepository.save(credential));
    }

    @Override
    @Transactional
    public IntegrationCredentialResponse update(Long credentialId, UpdateIntegrationCredentialRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }

        IntegrationCredential credential = getOwnedEntity(credentialId);
        String updatedName = trimToNull(request.getName());
        if (updatedName != null) {
            ensureUniqueName(credential.getAppUser().getUsername(), updatedName, credentialId);
            credential.setName(updatedName);
        }
        if (request.getType() != null) {
            credential.setType(request.getType());
        }
        if (request.getUsername() != null) {
            credential.setUsername(trimToNull(request.getUsername()));
        }
        if (request.getSecret() != null) {
            credential.setEncryptedSecret(encryptSecret(request.getSecret()));
        }
        if (request.getSecretReference() != null) {
            credential.setSecretReference(trimToNull(request.getSecretReference()));
        }

        validateStoredSecretState(credential.getEncryptedSecret(), credential.getSecretReference());
        return toResponse(integrationCredentialRepository.save(credential));
    }

    @Override
    @Transactional
    public void delete(Long credentialId) {
        integrationCredentialRepository.delete(getOwnedEntity(credentialId));
    }

    @Override
    @Transactional(readOnly = true)
    public IntegrationCredentialResponse get(Long credentialId) {
        return toResponse(getOwnedEntity(credentialId));
    }

    @Override
    @Transactional(readOnly = true)
    public ResolvedIntegrationCredentialResponse getResolved(Long credentialId) {
        IntegrationCredential credential = getOwnedEntity(credentialId);
        return ResolvedIntegrationCredentialResponse.builder()
                .id(credential.getId())
                .name(credential.getName())
                .type(credential.getType())
                .username(credential.getUsername())
                .secret(resolveSecret(credential))
                .secretReference(credential.getSecretReference())
                .createdAt(credential.getCreatedAt())
                .updatedAt(credential.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<IntegrationCredentialResponse> listMine(IntegrationCredentialType type) {
        String username = currentUsername();
        List<IntegrationCredential> credentials = type == null
                ? integrationCredentialRepository.findAllByAppUser_UsernameOrderByNameAsc(username)
                : integrationCredentialRepository.findAllByAppUser_UsernameAndTypeOrderByNameAsc(username, type);
        return credentials.stream().map(this::toResponse).toList();
    }

    private void validateCreate(CreateIntegrationCredentialRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        if (trimToNull(request.getName()) == null) {
            throw new IllegalArgumentException("Credential name is required");
        }
        if (request.getType() == null) {
            throw new IllegalArgumentException("Credential type is required");
        }
        validateStoredSecretState(request.getSecret(), request.getSecretReference());
    }

    private void validateStoredSecretState(String secret, String secretReference) {
        if (trimToNull(secret) == null && trimToNull(secretReference) == null) {
            throw new IllegalArgumentException("Either token/secret or secretReference is required");
        }
    }

    private void ensureUniqueName(String username, String name, Long existingId) {
        boolean exists = existingId == null
                ? integrationCredentialRepository.existsByAppUser_UsernameAndNameIgnoreCase(username, name)
                : integrationCredentialRepository.existsByAppUser_UsernameAndNameIgnoreCaseAndIdNot(username, name, existingId);
        if (exists) {
            throw new IllegalArgumentException("Integration credential name already exists: " + name);
        }
    }

    private IntegrationCredential getOwnedEntity(Long credentialId) {
        return integrationCredentialRepository.findByIdAndAppUser_Username(credentialId, currentUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Integration credential not found: " + credentialId));
    }

    private String encryptSecret(String secret) {
        String trimmed = trimToNull(secret);
        return trimmed == null ? null : encryptionService.encrypt(trimmed).getResult();
    }

    private String resolveSecret(IntegrationCredential credential) {
        if (trimToNull(credential.getEncryptedSecret()) != null) {
            return encryptionService.decrypt(credential.getEncryptedSecret()).getResult();
        }
        throw new IllegalStateException(
                "Credential uses external secret reference and runtime secret-manager resolution is not implemented yet"
        );
    }

    private IntegrationCredentialResponse toResponse(IntegrationCredential credential) {
        return IntegrationCredentialResponse.builder()
                .id(credential.getId())
                .name(credential.getName())
                .type(credential.getType())
                .username(credential.getUsername())
                .secretReference(credential.getSecretReference())
                .createdAt(credential.getCreatedAt())
                .updatedAt(credential.getUpdatedAt())
                .build();
    }

    private AppUser currentAppUser() {
        return appUserRepository.findByUsername(currentUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    private String currentUsername() {
        String username = appUserService.getCurrentUsername();
        if (trimToNull(username) == null) {
            throw new IllegalStateException("Unauthenticated request");
        }
        return username;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
