package com.datashare.common.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/**
 * Corps normalisé des réponses d'erreur de l'API.
 *
 * <p>{@code debug} est omis (non sérialisé) quand il est {@code null}, c'est-à-dire en mode non
 * verbeux (profil prod).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        Instant timestamp, int status, String error, String code, String message, String path, String debug) {}
