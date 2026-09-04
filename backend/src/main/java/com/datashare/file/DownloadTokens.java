package com.datashare.file;

import java.security.SecureRandom;
import java.util.Base64;

/** Jetons de téléchargement non prédictibles (192 bits d'entropie, base64url, 32 caractères). */
public final class DownloadTokens {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int BYTES = 24;

    private DownloadTokens() {}

    public static String generate() {
        byte[] buffer = new byte[BYTES];
        RANDOM.nextBytes(buffer);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }
}
