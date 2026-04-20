package com.pw.edu.pl.master.thesis.user.dto.project;

import lombok.Data;

@Data
public class ProjectResponse {
    private Long id;
    private String key;
    private String name;
    private String description;
    private String baseUrl;
    private String projectTypeKey;
}
