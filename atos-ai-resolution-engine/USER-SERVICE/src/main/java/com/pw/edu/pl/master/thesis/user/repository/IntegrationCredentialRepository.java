package com.pw.edu.pl.master.thesis.user.repository;

import com.pw.edu.pl.master.thesis.user.enums.IntegrationCredentialType;
import com.pw.edu.pl.master.thesis.user.model.user.IntegrationCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IntegrationCredentialRepository extends JpaRepository<IntegrationCredential, Long> {
    List<IntegrationCredential> findAllByAppUser_UsernameOrderByNameAsc(String username);
    Optional<IntegrationCredential> findByIdAndAppUser_Username(Long id, String username);
    boolean existsByAppUser_UsernameAndNameIgnoreCase(String username, String name);
    boolean existsByAppUser_UsernameAndNameIgnoreCaseAndIdNot(String username, String name, Long id);
    List<IntegrationCredential> findAllByAppUser_UsernameAndTypeOrderByNameAsc(String username, IntegrationCredentialType type);
}
