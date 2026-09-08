package com.datashare.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * Configuration de sécurité — stateless, JWT resource-server.
 *
 * <p>Deux chaînes de filtres :
 *
 * <ul>
 *   <li><b>publique</b> ({@link #PUBLIC_ENDPOINTS}) : ping, health, Swagger (GET),
 *       {@code POST /api/auth/register|login} et {@code GET|POST /api/d/*} (liens de partage, US02).
 *       Aucune authentification — et surtout aucune validation d'un éventuel en-tête
 *       {@code Authorization: Bearer}. Sans cette isolation, un token expiré encore présent côté
 *       client ferait échouer la connexion / l'inscription en 401 avant même d'atteindre le
 *       contrôleur (bug : le login est justement censé émettre un jeton neuf).
 *   <li><b>API</b> : tout le reste exige un access token JWT valide (voir {@link SecurityBeans}).
 * </ul>
 *
 * <p>Inactif sous le profil {@code purge} (outil de maintenance sans contexte web).
 */
@Configuration
@Profile("!purge")
public class SecurityConfig {

    private static final RequestMatcher PUBLIC_ENDPOINTS = publicEndpoints();

    private static RequestMatcher publicEndpoints() {
        PathPatternRequestMatcher.Builder m = PathPatternRequestMatcher.withDefaults();
        return new OrRequestMatcher(
                m.matcher(HttpMethod.GET, "/api/ping"),
                m.matcher(HttpMethod.GET, "/actuator/health"),
                m.matcher(HttpMethod.GET, "/actuator/health/**"),
                m.matcher(HttpMethod.GET, "/v3/api-docs/**"),
                m.matcher(HttpMethod.GET, "/swagger-ui/**"),
                m.matcher(HttpMethod.GET, "/swagger-ui.html"),
                m.matcher(HttpMethod.POST, "/api/auth/register"),
                m.matcher(HttpMethod.POST, "/api/auth/login"),
                m.matcher(HttpMethod.GET, "/api/d/*"),
                m.matcher(HttpMethod.POST, "/api/d/*"));
    }

    @Bean
    @Order(1)
    SecurityFilterChain publicSecurityFilterChain(HttpSecurity http) throws Exception {
        http.securityMatcher(PUBLIC_ENDPOINTS)
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    @Order(2)
    SecurityFilterChain apiSecurityFilterChain(HttpSecurity http, RestAuthenticationEntryPoint entryPoint)
            throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .oauth2ResourceServer(
                        oauth2 -> oauth2.jwt(Customizer.withDefaults()).authenticationEntryPoint(entryPoint))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(entryPoint));
        return http.build();
    }
}
