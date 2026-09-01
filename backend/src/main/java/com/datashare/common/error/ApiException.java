package com.datashare.common.error;

/**
 * Exception métier de base.
 *
 * <p>{@code message} : texte générique destiné à l'utilisateur (toujours renvoyé). {@code
 * debugDetail} : contexte technique, renvoyé seulement quand {@code datashare.error.verbose=true}.
 */
public class ApiException extends RuntimeException {

    private final ErrorCode code;
    private final String debugDetail;

    public ApiException(ErrorCode code, String message, String debugDetail) {
        super(message);
        this.code = code;
        this.debugDetail = debugDetail;
    }

    public ApiException(ErrorCode code, String message) {
        this(code, message, null);
    }

    public ErrorCode code() {
        return code;
    }

    public String debugDetail() {
        return debugDetail;
    }
}
