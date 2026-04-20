package com.pw.edu.pl.master.thesis.user.dto.site;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignSiteRequest {
    private Long userId;
    private Boolean defaultForUser;
}
