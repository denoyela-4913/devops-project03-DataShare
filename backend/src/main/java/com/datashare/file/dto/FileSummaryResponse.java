package com.datashare.file.dto;

import java.time.Instant;
import java.util.UUID;

/** Une ligne de l'historique des fichiers d'un utilisateur ({@code GET /api/files}, US05). */
public record FileSummaryResponse(
        UUID id,
        String name,
        long sizeBytes,
        Instant createdAt,
        Instant expiresAt,
        boolean passwordProtected,
        String downloadUrl) {}
