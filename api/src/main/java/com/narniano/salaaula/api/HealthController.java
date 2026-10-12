package com.narniano.salaaula.api;

import java.time.Instant;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping("/health")
    public HealthResponse health() {
        return new HealthResponse("ok", "rural-sala-de-aula-api", "0.1.0", Instant.now());
    }

    public record HealthResponse(String status, String service, String version, Instant timestamp) {
    }
}
