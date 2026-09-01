package com.datashare.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuration de sécurité — squelette.
 *
 * <p>Stateless, endpoints publics explicites, tout le reste authentifié. Le câblage JWT
 * (resource-server + {@code JwtDecoder}/{@code JwtEncoder}) arrive avec la feature auth (US03/US04).
 */
@Configuration
public class SecurityConfig {

    private static final String[] PUBLIC_GET = {
        "/api/ping", "/actuator/health", "/actuator/health/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
    };

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.GET, PUBLIC_GET)
                        .permitAll()
                        .anyRequest()
                        .authenticated());
        return http.build();
    }
}
