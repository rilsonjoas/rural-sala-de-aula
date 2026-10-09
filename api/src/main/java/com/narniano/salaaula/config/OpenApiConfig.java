package com.narniano.salaaula.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI salaAulaOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Rural Sala de Aula API")
                .description("API REST do Rural Sala de Aula")
                .version("0.1.0"));
    }
}
