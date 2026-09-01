package com.datashare.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Métadonnées OpenAPI. Actif uniquement quand {@code springdoc.api-docs.enabled=true} (profil dev). */
@Configuration
@ConditionalOnProperty(prefix = "springdoc.api-docs", name = "enabled", havingValue = "true")
public class OpenApiConfig {

    @Bean
    OpenAPI dataShareOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("DataShare API")
                        .version("v0")
                        .description("Transfert de fichiers via liens de téléchargement temporaires."));
    }
}
