package com.datashare.auth.dto;

/**
 * Jeton d'accès renvoyé après inscription ou connexion.
 *
 * @param accessToken JWT signé (HS256)
 * @param tokenType toujours {@code "Bearer"}
 * @param expiresIn durée de validité en secondes
 */
public record TokenResponse(String accessToken, String tokenType, long expiresIn) {

    public static TokenResponse bearer(String accessToken, long expiresIn) {
        return new TokenResponse(accessToken, "Bearer", expiresIn);
    }
}
