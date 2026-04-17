package com.pw.edu.pl.master.thesis.user.controller;

import com.pw.edu.pl.master.thesis.user.dto.user.LoginRequest;
import com.pw.edu.pl.master.thesis.user.dto.user.LoginResponse;
import com.pw.edu.pl.master.thesis.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.userLogin(request));
    }
}
