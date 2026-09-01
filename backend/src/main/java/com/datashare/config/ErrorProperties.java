package com.datashare.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Contrôle du niveau de détail des réponses d'erreur.
 *
 * @param verbose {@code true} (profil dev) → le champ {@code debug} est renseigné ; {@code false}
 *     (profil prod) → il est absent.
 */
@ConfigurationProperties(prefix = "datashare.error")
public record ErrorProperties(boolean verbose) {}
