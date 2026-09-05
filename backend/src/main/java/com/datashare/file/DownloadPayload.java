package com.datashare.file;

import java.io.InputStream;

/**
 * Flux d'octets d'un fichier + en-têtes à poser sur la réponse. Le {@code content} est ouvert
 * par le service et fermé par la couche web une fois la réponse écrite.
 */
public record DownloadPayload(InputStream content, String filename, String contentType, long sizeBytes) {}
