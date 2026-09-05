package com.datashare.file.exception;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;

/** 403 — mot de passe du fichier absent ou incorrect (US02/US09). */
public class InvalidFilePasswordException extends ApiException {

    public InvalidFilePasswordException() {
        super(ErrorCode.FORBIDDEN, "Mot de passe incorrect", "mot de passe du fichier absent ou invalide");
    }
}
