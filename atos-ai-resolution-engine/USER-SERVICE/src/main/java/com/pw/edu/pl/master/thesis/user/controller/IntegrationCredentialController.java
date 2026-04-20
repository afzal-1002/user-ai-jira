package com.pw.edu.pl.master.thesis.user.controller;

import com.pw.edu.pl.master.thesis.user.dto.credentials.CreateIntegrationCredentialRequest;
import com.pw.edu.pl.master.thesis.user.dto.credentials.IntegrationCredentialResponse;
import com.pw.edu.pl.master.thesis.user.dto.credentials.ResolvedIntegrationCredentialResponse;
import com.pw.edu.pl.master.thesis.user.dto.credentials.UpdateIntegrationCredentialRequest;
import com.pw.edu.pl.master.thesis.user.enums.IntegrationCredentialType;
import com.pw.edu.pl.master.thesis.user.service.IntegrationCredentialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wut/integration-credentials")
@RequiredArgsConstructor
public class IntegrationCredentialController {

    private final IntegrationCredentialService integrationCredentialService;

    @PostMapping
    public ResponseEntity<IntegrationCredentialResponse> create(@RequestBody CreateIntegrationCredentialRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(integrationCredentialService.create(request));
    }

    @GetMapping("/me")
    public ResponseEntity<List<IntegrationCredentialResponse>> listMine(
            @RequestParam(name = "type", required = false) IntegrationCredentialType type
    ) {
        return ResponseEntity.ok(integrationCredentialService.listMine(type));
    }

    @GetMapping("/{credentialId}")
    public ResponseEntity<IntegrationCredentialResponse> get(@PathVariable Long credentialId) {
        return ResponseEntity.ok(integrationCredentialService.get(credentialId));
    }

    @GetMapping("/{credentialId}/resolved")
    public ResponseEntity<ResolvedIntegrationCredentialResponse> getResolved(@PathVariable Long credentialId) {
        return ResponseEntity.ok(integrationCredentialService.getResolved(credentialId));
    }

    @PutMapping("/{credentialId}")
    public ResponseEntity<IntegrationCredentialResponse> update(
            @PathVariable Long credentialId,
            @RequestBody UpdateIntegrationCredentialRequest request
    ) {
        return ResponseEntity.ok(integrationCredentialService.update(credentialId, request));
    }

    @DeleteMapping("/{credentialId}")
    public ResponseEntity<Void> delete(@PathVariable Long credentialId) {
        integrationCredentialService.delete(credentialId);
        return ResponseEntity.noContent().build();
    }
}
