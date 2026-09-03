package com.datashare.unit.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.datashare.auth.JwtProperties;
import com.datashare.auth.JwtService;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

class JwtServiceTest {

    private static final String SECRET = "unit-test-jwt-secret-0123456789-0123456789";

    private JwtService jwtService;
    private JwtDecoder decoder;

    @BeforeEach
    void setUp() {
        SecretKey key = new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        var encoder = new NimbusJwtEncoder(new ImmutableSecret<SecurityContext>(key));
        decoder = NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        jwtService = new JwtService(encoder, new JwtProperties(SECRET, "datashare", Duration.ofHours(1)));
    }

    @Test
    void generates_a_token_that_decodes_with_the_expected_claims() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.generateToken(userId, "alice@example.com");
        Jwt decoded = decoder.decode(token);

        assertThat(decoded.getSubject()).isEqualTo(userId.toString());
        assertThat(decoded.getClaimAsString("email")).isEqualTo("alice@example.com");
        assertThat(decoded.getClaimAsString("iss")).isEqualTo("datashare");
        assertThat(decoded.getExpiresAt()).isNotNull().isAfter(Instant.now());
    }

    @Test
    void access_ttl_is_exposed_in_seconds() {
        assertThat(jwtService.accessTtlSeconds()).isEqualTo(3600L);
    }
}
