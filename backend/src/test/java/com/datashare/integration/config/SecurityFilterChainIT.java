package com.datashare.integration.config;

import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.datashare.auth.JwtService;
import com.datashare.support.AbstractIntegrationTest;
import com.datashare.user.User;
import com.datashare.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

/**
 * Sécurité de bout en bout des deux chaînes de filtres ({@code SecurityConfig}).
 *
 * <p>Les routes publiques répondent sans jeton — et <b>aussi</b> quand un
 * {@code Authorization: Bearer} expiré traîne encore côté client (sinon connexion / inscription
 * échouent en 401 alors qu'elles sont précisément censées émettre un jeton neuf). Les routes
 * privées, elles, exigent un jeton valide.
 */
@AutoConfigureMockMvc
@Transactional
class SecurityFilterChainIT extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JwtEncoder jwtEncoder;

    @Autowired
    private JsonMapper json;

    private String credentials(String email, String password) {
        return json.writeValueAsString(Map.of("email", email, "password", password));
    }

    /** Jeton signé avec la bonne clé mais expiré depuis une heure. */
    private String expiredToken() {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("datashare")
                .issuedAt(now.minus(Duration.ofHours(2)))
                .expiresAt(now.minus(Duration.ofHours(1)))
                .subject(UUID.randomUUID().toString())
                .claim("email", "stale@example.com")
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private String bearerFor(String email) {
        User user = users.saveAndFlush(new User(email, "hash"));
        return "Bearer " + jwtService.generateToken(user.getId(), user.getEmail());
    }

    // ── Routes publiques : joignables sans jeton ─────────────────────────────

    @Test
    void public_ping_is_reachable_without_a_token() throws Exception {
        mockMvc.perform(get("/api/ping")).andExpect(status().isOk());
    }

    @Test
    void public_health_is_reachable_without_a_token() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void public_register_is_reachable_without_a_token() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials("no-bearer@example.com", "password123")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void public_share_link_is_not_rejected_as_unauthorized_without_a_token() throws Exception {
        mockMvc.perform(get("/api/d/{token}", "unknown-token")).andExpect(status().is(not(401)));
    }

    // ── Routes publiques : un Bearer expiré ne doit PAS les faire échouer (régression) ──

    @Test
    void public_ping_still_reachable_with_an_expired_bearer() throws Exception {
        mockMvc.perform(get("/api/ping").header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken()))
                .andExpect(status().isOk());
    }

    @Test
    void register_still_issues_a_fresh_token_despite_an_expired_bearer() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials("expired-bearer@example.com", "password123")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void login_still_issues_a_fresh_token_despite_an_expired_bearer() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials("relog@example.com", "password123")))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/login")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(credentials("relog@example.com", "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    void public_share_link_still_not_rejected_as_unauthorized_with_an_expired_bearer() throws Exception {
        mockMvc.perform(get("/api/d/{token}", "unknown-token")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken()))
                .andExpect(status().is(not(401)));
    }

    // ── Routes privées : jeton valide obligatoire ────────────────────────────

    @Test
    void private_me_without_a_bearer_is_401() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void private_files_without_a_bearer_is_401() throws Exception {
        mockMvc.perform(get("/api/files"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void private_me_with_an_expired_bearer_is_401() throws Exception {
        mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void private_me_with_a_valid_bearer_is_200() throws Exception {
        mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, bearerFor("valid-bearer@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("valid-bearer@example.com"));
    }

    @Test
    void private_files_with_a_valid_bearer_is_200() throws Exception {
        mockMvc.perform(get("/api/files").header(HttpHeaders.AUTHORIZATION, bearerFor("lister@example.com")))
                .andExpect(status().isOk());
    }
}
