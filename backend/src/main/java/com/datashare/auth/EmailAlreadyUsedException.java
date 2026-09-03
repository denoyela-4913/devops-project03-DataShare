package com.datashare.auth;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;

/** 409 — l'adresse email est déjà associée à un compte (US03). */
public class EmailAlreadyUsedException extends ApiException {

    public EmailAlreadyUsedException(String email) {
        super(
                ErrorCode.EMAIL_ALREADY_USED,
                "Cette adresse email est déjà utilisée",
                "L'email " + email + " est déjà associé à un compte");
    }
}
