package com.datashare.user.dto;

import java.util.UUID;

/** Réponse de {@code GET /api/me}. */
public record MeResponse(UUID id, String email) {}
