package com.datashare.file;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Métadonnées d'un fichier déposé (table {@code stored_file}). Les octets sont dans le stockage objet. */
@Entity
@Table(name = "stored_file")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StoredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "download_token", nullable = false, unique = true, length = 64)
    private String downloadToken;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "content_type", nullable = false, length = 127)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    /** {@code null} = fichier non protégé. */
    @Column(name = "password_hash")
    private String passwordHash;

    /** {@code null} = dépôt anonyme (US07). */
    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public StoredFile(
            String downloadToken,
            String originalName,
            String contentType,
            long sizeBytes,
            String storageKey,
            String passwordHash,
            UUID ownerId,
            Instant expiresAt) {
        this.downloadToken = downloadToken;
        this.originalName = originalName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.storageKey = storageKey;
        this.passwordHash = passwordHash;
        this.ownerId = ownerId;
        this.expiresAt = expiresAt;
        this.createdAt = Instant.now();
    }

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }

    public boolean isPasswordProtected() {
        return passwordHash != null;
    }
}
