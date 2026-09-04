package com.datashare.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Accès au stockage objet (S3 / MinIO).
 *
 * @param endpoint URL du service (ex. {@code http://localhost:9000})
 * @param bucket nom du bucket
 * @param accessKey identifiant
 * @param secretKey secret
 */
@ConfigurationProperties(prefix = "datashare.storage")
public record StorageProperties(String endpoint, String bucket, String accessKey, String secretKey) {}
