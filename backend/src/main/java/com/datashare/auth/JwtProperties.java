package com.datashare.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration du JWT.
 *
 * @param secret clé HMAC (HS256) — au moins 32 octets ; fournie par l'environnement en prod
 * @param issuer valeur du claim {@code iss}
 * @param accessTtl durée de vie de l'access token
 */
@ConfigurationProperties(prefix = "datashare.jwt")
public record JwtProperties(String secret, String issuer, Duration accessTtl) {}
