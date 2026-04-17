package com.pw.edu.pl.master.thesis.ai.configuration;

import com.pw.edu.pl.master.thesis.ai.service.JiraMcpTools;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class McpToolConfiguration {

    @Bean
    ToolCallbackProvider jiraMcpToolProvider(JiraMcpTools jiraMcpTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(jiraMcpTools)
                .build();
    }
}
