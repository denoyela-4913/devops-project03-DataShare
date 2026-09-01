package com.datashare.common.error;

/** 404 — ressource inexistante ou lien invalide. */
public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String message, String debugDetail) {
        super(ErrorCode.NOT_FOUND, message, debugDetail);
    }
}
