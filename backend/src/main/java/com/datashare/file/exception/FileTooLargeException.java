package com.datashare.file.exception;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;

/** 413 — le fichier dépasse la taille maximale autorisée. */
public class FileTooLargeException extends ApiException {

    public FileTooLargeException(long sizeBytes, long maxBytes) {
        super(
                ErrorCode.FILE_TOO_LARGE,
                "Le fichier dépasse la taille maximale autorisée (1 Go)",
                "taille " + sizeBytes + " o > maximum " + maxBytes + " o");
    }
}
