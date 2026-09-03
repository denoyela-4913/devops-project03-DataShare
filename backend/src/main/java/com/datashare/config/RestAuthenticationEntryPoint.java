package com.datashare.config;

import com.datashare.common.error.ErrorCode;
import com.datashare.common.web.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/**
 * Rend un {@link ErrorResponse} JSON (au lieu de la réponse Spring par défaut) quand l'accès à un
 * endpoint protégé est tenté sans authentification valide.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final JsonMapper jsonMapper;
    private final ErrorProperties errorProperties;

    public RestAuthenticationEntryPoint(JsonMapper jsonMapper, ErrorProperties errorProperties) {
        this.jsonMapper = jsonMapper;
        this.errorProperties = errorProperties;
    }

    @Override
    public void commence(
            HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        String debug = errorProperties.verbose() ? authException.getMessage() : null;
        ErrorResponse body = new ErrorResponse(
                Instant.now(),
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                ErrorCode.UNAUTHORIZED.name(),
                "Authentification requise",
                request.getRequestURI(),
                debug);
        jsonMapper.writeValue(response.getWriter(), body);
    }
}
