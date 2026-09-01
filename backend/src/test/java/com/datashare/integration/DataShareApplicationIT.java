package com.datashare.integration;

import com.datashare.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

/** Smoke : le contexte Spring démarre (JPA + Flyway V1 + sécurité) contre une vraie base. */
class DataShareApplicationIT extends AbstractIntegrationTest {

    @Test
    void contextLoads() {
        // le contexte se charge, ou le test échoue
    }
}
