package com.datashare.unit.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

/**
 * Garde de configuration : le profil prod ne doit jamais réactiver le mode debug.
 *
 * <p>Pendant du job CI {@code assert-prod-bundle} côté front.
 */
class ProdProfileConfigTest {

    private PropertySource<?> prodProperties() throws Exception {
        List<PropertySource<?>> sources =
                new YamlPropertySourceLoader().load("application-prod", new ClassPathResource("application-prod.yml"));
        return sources.get(0);
    }

    @Test
    void prod_profile_keeps_errors_non_verbose_and_hardened() throws Exception {
        PropertySource<?> prod = prodProperties();
        assertThat(prod.getProperty("datashare.error.verbose")).isEqualTo(false);
        assertThat(prod.getProperty("server.error.include-stacktrace")).isEqualTo("never");
        assertThat(prod.getProperty("server.error.include-message")).isEqualTo("never");
        assertThat(prod.getProperty("springdoc.api-docs.enabled")).isEqualTo(false);
        assertThat(prod.getProperty("springdoc.swagger-ui.enabled")).isEqualTo(false);
    }
}
