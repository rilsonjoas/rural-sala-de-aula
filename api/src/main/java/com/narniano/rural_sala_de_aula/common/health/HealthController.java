package com.narniano.rural_sala_de_aula.common.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    private final String service;
    private final String version;

    public HealthController(@Value("${spring.application.name}") String applicationName) {
        this.service = applicationName + "-api";
        String implementationVersion = HealthController.class.getPackage().getImplementationVersion();
        this.version = implementationVersion != null ? implementationVersion : "dev";
    }

    @GetMapping
    public HealthResponse health() {
        return new HealthResponse("ok", service, version, Instant.now());
    }

    public record HealthResponse(String status, String service, String version, Instant timestamp) {}
}
