package com.pw.edu.pl.master.thesis.user.dto.user;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {
    @JsonAlias("username")
    private String userName;
    private String firstName;
    private String lastName;
    private String emailAddress;
    private String displayName;
    private Boolean isActive;
    private String password;
    private List<Long> siteIds;
}
