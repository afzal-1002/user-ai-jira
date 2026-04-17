package com.pw.edu.pl.master.thesis.ai.configuration;

import feign.RequestInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignSecurityConfiguration {
    @Bean
    public RequestInterceptor authRelayInterceptor() {
        return template -> {
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes sra) {
                HttpServletRequest req = sra.getRequest();
                String auth = req.getHeader(HttpHeaders.AUTHORIZATION);
                if (auth != null && !auth.isBlank()) {
                    template.header(HttpHeaders.AUTHORIZATION, auth);
                }
                String siteId = req.getHeader("X-Site-Id");
                if ((siteId == null || siteId.isBlank()) && req.getParameter("siteId") != null) {
                    siteId = req.getParameter("siteId");
                }
                if (siteId != null && !siteId.isBlank()) {
                    template.header("X-Site-Id", siteId);
                }
            }
        };
    }
}
