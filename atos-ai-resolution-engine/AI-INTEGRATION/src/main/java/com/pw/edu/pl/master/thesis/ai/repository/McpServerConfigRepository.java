package com.pw.edu.pl.master.thesis.ai.repository;

import com.pw.edu.pl.master.thesis.ai.model.McpServerConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface McpServerConfigRepository extends JpaRepository<McpServerConfig, Long> {

    Optional<McpServerConfig> findFirstByEnabledTrueOrderByUpdatedAtDesc();

    List<McpServerConfig> findAllByEnabledTrueAndIdNot(Long id);

    List<McpServerConfig> findAllByEnabledTrue();
}
