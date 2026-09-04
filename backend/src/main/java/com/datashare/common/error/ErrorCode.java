package com.datashare.common.error;

import org.springframework.http.HttpStatus;

/** Codes d'erreur métier stables, exposés dans le champ {@code code} des réponses d'erreur. */
public enum ErrorCode {
    VALIDATION(HttpStatus.BAD_REQUEST),
    NOT_FOUND(HttpStatus.NOT_FOUND),
    CONFLICT(HttpStatus.CONFLICT),
    EMAIL_ALREADY_USED(HttpStatus.CONFLICT),
    EXPIRED(HttpStatus.GONE),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    FORBIDDEN(HttpStatus.FORBIDDEN),
    FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE),
    FORBIDDEN_FILE_TYPE(HttpStatus.BAD_REQUEST),
    INVALID_EXPIRATION(HttpStatus.BAD_REQUEST),
    INTERNAL(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
