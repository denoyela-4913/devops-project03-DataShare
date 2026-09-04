package com.datashare.file.exception;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;

/** 400 — la durée d'expiration demandée est hors bornes (1 à 7 jours). */
public class InvalidExpirationException extends ApiException {

    public InvalidExpirationException(int requestedDays, int maxDays) {
        super(
                ErrorCode.INVALID_EXPIRATION,
                "La durée d'expiration doit être comprise entre 1 et " + maxDays + " jours",
                "valeur demandée : " + requestedDays);
    }
}
