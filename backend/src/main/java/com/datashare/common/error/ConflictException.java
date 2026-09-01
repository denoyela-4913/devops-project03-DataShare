package com.datashare.common.error;

/** 409 — conflit d'état (ex. email déjà utilisé, tag en double). */
public class ConflictException extends ApiException {

    public ConflictException(String message, String debugDetail) {
        super(ErrorCode.CONFLICT, message, debugDetail);
    }
}
