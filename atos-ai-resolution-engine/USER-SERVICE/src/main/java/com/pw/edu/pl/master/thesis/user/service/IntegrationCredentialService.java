package com.pw.edu.pl.master.thesis.user.service;

import com.pw.edu.pl.master.thesis.user.dto.credentials.CreateIntegrationCredentialRequest;
import com.pw.edu.pl.master.thesis.user.dto.credentials.IntegrationCredentialResponse;
import com.pw.edu.pl.master.thesis.user.dto.credentials.ResolvedIntegrationCredentialResponse;
import com.pw.edu.pl.master.thesis.user.dto.credentials.UpdateIntegrationCredentialRequest;
import com.pw.edu.pl.master.thesis.user.enums.IntegrationCredentialType;

import java.util.List;

public interface IntegrationCredentialService {
    IntegrationCredentialResponse create(CreateIntegrationCredentialRequest request);
    IntegrationCredentialResponse update(Long credentialId, UpdateIntegrationCredentialRequest request);
    void delete(Long credentialId);
    IntegrationCredentialResponse get(Long credentialId);
    ResolvedIntegrationCredentialResponse getResolved(Long credentialId);
    List<IntegrationCredentialResponse> listMine(IntegrationCredentialType type);
}
