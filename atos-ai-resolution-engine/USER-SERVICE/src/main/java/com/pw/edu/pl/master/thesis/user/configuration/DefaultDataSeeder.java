package com.pw.edu.pl.master.thesis.user.configuration;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DefaultDataSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) {
        // Intentionally left blank. Startup must not mutate user or site data.
    }
}
