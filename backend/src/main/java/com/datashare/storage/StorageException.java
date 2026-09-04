package com.datashare.storage;

/** Défaillance du stockage objet (réseau, permissions, bucket…). Traduite en 500. */
public class StorageException extends RuntimeException {

    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
