package com.datashare.storage;

import java.io.InputStream;

/**
 * Stockage des octets d'un fichier. Générique : aucune notion de fournisseur ne doit fuir ici
 * (implémentation actuelle : MinIO via le protocole S3 — voir {@link S3StorageService}).
 */
public interface StorageService {

    /** Écrit un objet. {@code size} est la taille exacte du flux ; {@code content} n'est pas fermé. */
    void store(String key, InputStream content, long size, String contentType);

    /** Ouvre un flux de lecture sur l'objet. À fermer par l'appelant. */
    InputStream retrieve(String key);

    void delete(String key);

    boolean exists(String key);
}
