package com.datashare.maintenance;

import com.datashare.file.StoredFile;
import com.datashare.file.StoredFileRepository;
import com.datashare.storage.StorageService;
import java.time.Instant;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Supprime les fichiers dont la date d'expiration est dépassée : ligne {@code stored_file}
 * puis objet de stockage (best-effort, comme {@code FileService.delete}). Chaque fichier
 * est traité indépendamment — l'échec de l'un n'interrompt pas la purge.
 *
 * <p>Outil d'exploitation manuel (profil {@code purge}, voir {@code deploy/purge-expired.sh}).
 * La purge automatique planifiée (US10) réutilisera {@link #purge()}.
 */
@Slf4j
@Component
@Profile("purge")
public class ExpiredFilePurger {

    private final StoredFileRepository files;
    private final StorageService storage;

    public ExpiredFilePurger(StoredFileRepository files, StorageService storage) {
        this.files = files;
        this.storage = storage;
    }

    public PurgeReport purge() {
        List<StoredFile> expired = files.findByExpiresAtBefore(Instant.now());
        int deleted = 0;
        int storageFailures = 0;

        for (StoredFile file : expired) {
            try {
                files.delete(file);
            } catch (RuntimeException e) {
                log.warn("Ligne {} non supprimée, on continue", file.getId(), e);
                continue;
            }
            deleted++;
            try {
                storage.delete(file.getStorageKey());
            } catch (RuntimeException e) {
                storageFailures++;
                log.warn("Objet {} non supprimé du stockage (fichier {})", file.getStorageKey(), file.getId(), e);
            }
        }

        log.info(
                "Purge : {}/{} fichier(s) expiré(s) supprimé(s) — {} échec(s) stockage",
                deleted,
                expired.size(),
                storageFailures);
        return new PurgeReport(deleted, storageFailures);
    }
}
