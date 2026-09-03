package com.datashare.auth;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;

/**
 * 401 — email inconnu ou mot de passe incorrect (US04).
 *
 * <p>Le message utilisateur est volontairement identique dans les deux cas (pas d'énumération
 * de comptes) ; le {@code debugDetail} précise la cause réelle, visible en mode verbeux uniquement.
 */
public class InvalidCredentialsException extends ApiException {

    public InvalidCredentialsException(String debugDetail) {
        super(ErrorCode.INVALID_CREDENTIALS, "Email ou mot de passe incorrect", debugDetail);
    }
}
