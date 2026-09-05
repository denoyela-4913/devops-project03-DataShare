package com.datashare.file.dto;

import java.time.Instant;

/** Réponse de {@code GET /api/d/{token}} — infos affichables avant téléchargement (US02). */
public record FileMetadataResponse(String name, long sizeBytes, Instant expiresAt, boolean passwordProtected) {}
