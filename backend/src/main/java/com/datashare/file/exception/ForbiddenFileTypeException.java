package com.datashare.file.exception;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;

/** 400 — l'extension du fichier figure dans la liste noire (politique de sécurité, US01). */
public class ForbiddenFileTypeException extends ApiException {

    public ForbiddenFileTypeException(String extension) {
        super(
                ErrorCode.FORBIDDEN_FILE_TYPE,
                "Ce type de fichier n'est pas autorisé",
                "extension interdite : ." + extension);
    }
}
