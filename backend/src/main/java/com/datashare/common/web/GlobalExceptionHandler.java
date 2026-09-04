package com.datashare.common.web;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;
import com.datashare.config.ErrorProperties;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

/**
 * Traduit les exceptions en {@link ErrorResponse}. Le champ {@code debug} n'est rempli que si {@link
 * ErrorProperties#verbose()} est vrai.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final ErrorProperties errorProperties;

    public GlobalExceptionHandler(ErrorProperties errorProperties) {
        this.errorProperties = errorProperties;
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException ex, HttpServletRequest request) {
        return build(ex.code().status(), ex.code().name(), ex.getMessage(), ex.debugDetail(), request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String debug = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse(null);
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION.name(), "Requête invalide", debug, request);
    }

    @ExceptionHandler({MissingServletRequestPartException.class, MissingServletRequestParameterException.class})
    public ResponseEntity<ErrorResponse> handleMissingPart(Exception ex, HttpServletRequest request) {
        return build(
                HttpStatus.BAD_REQUEST,
                ErrorCode.VALIDATION.name(),
                "Paramètre requis manquant",
                ex.getMessage(),
                request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleUploadTooLarge(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return build(
                ErrorCode.FILE_TOO_LARGE.status(),
                ErrorCode.FILE_TOO_LARGE.name(),
                "Le fichier dépasse la taille maximale autorisée (1 Go)",
                ex.getMessage(),
                request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        String debug = ex.getClass().getSimpleName() + ": " + ex.getMessage();
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL.name(), "Erreur interne", debug, request);
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status, String code, String message, String debugDetail, HttpServletRequest request) {
        String debug = errorProperties.verbose() ? debugDetail : null;
        ErrorResponse body = new ErrorResponse(
                Instant.now(), status.value(), status.getReasonPhrase(), code, message, request.getRequestURI(), debug);
        return ResponseEntity.status(status).body(body);
    }
}
