package com.datashare.file;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Politique de dépôt de fichiers (US01).
 *
 * @param maxSizeBytes taille maximale (1 Go)
 * @param defaultExpirationDays durée de validité par défaut
 * @param maxExpirationDays plafond (7 jours)
 * @param blockedExtensions extensions interdites (sans le point), en minuscules
 * @param baseDownloadUrl préfixe absolu (origine publique du frontend + {@code /d}) des liens de
 *     téléchargement ; optionnel — vide, les liens sont relatifs ({@code /d/<token>})
 */
@ConfigurationProperties(prefix = "datashare.files")
public record FileProperties(
        long maxSizeBytes,
        int defaultExpirationDays,
        int maxExpirationDays,
        List<String> blockedExtensions,
        String baseDownloadUrl) {

    public Set<String> blockedExtensionSet() {
        return blockedExtensions.stream()
                .map(e -> e.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
    }
}
