package com.datashare.file.dto;

import java.time.Instant;

/** Réponse de {@code POST /api/files}. */
public record UploadResponse(String downloadUrl, String token, String name, long sizeBytes, Instant expiresAt) {}
