package com.datashare.file;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByDownloadToken(String downloadToken);

    List<StoredFile> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    Optional<StoredFile> findByIdAndOwnerId(UUID id, UUID ownerId);

    /** Fichiers dont la date d'expiration est dépassée (outil de purge, futur cron US10). */
    List<StoredFile> findByExpiresAtBefore(Instant cutoff);
}
