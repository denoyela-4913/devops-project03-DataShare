package com.datashare.maintenance;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Sous le profil {@code purge}, lance la purge au démarrage puis arrête l'application.
 * Code de sortie 1 si au moins un objet de stockage n'a pas pu être supprimé.
 *
 * <p>Usage : {@code java -jar datashare-backend-*.jar --spring.profiles.active=dev,purge}
 * (le profil de base — {@code dev}, {@code prod}… — fournit la config de connexion).
 */
@Component
@Profile("purge")
public class PurgeRunner implements ApplicationRunner {

    private final ExpiredFilePurger purger;
    private final ConfigurableApplicationContext context;

    public PurgeRunner(ExpiredFilePurger purger, ConfigurableApplicationContext context) {
        this.purger = purger;
        this.context = context;
    }

    @Override
    public void run(ApplicationArguments args) {
        PurgeReport report = purger.purge();
        System.exit(SpringApplication.exit(context, report::exitCode));
    }
}
