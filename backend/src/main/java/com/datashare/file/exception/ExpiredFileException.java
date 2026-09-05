package com.datashare.file.exception;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;

/** 410 — le lien de téléchargement a dépassé sa date d'expiration (US02). */
public class ExpiredFileException extends ApiException {

    public ExpiredFileException(String token) {
        super(ErrorCode.EXPIRED, "Ce lien de téléchargement a expiré", "token expiré : " + token);
    }
}
