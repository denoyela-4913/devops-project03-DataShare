package com.datashare;

import org.springframework.boot.SpringApplication;

/** Point d'entrée pour lancer l'appli en local avec les conteneurs de test ({@code mvn spring-boot:test-run}). */
public final class TestDataShareApplication {

    private TestDataShareApplication() {}

    public static void main(String[] args) {
        SpringApplication.from(DataShareApplication::main)
                .with(TestcontainersConfiguration.class)
                .run(args);
    }
}
