package com.datashare.storage;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;
import java.io.InputStream;
import org.springframework.stereotype.Service;

/** Implémentation MinIO (protocole S3) de {@link StorageService}. */
@Service
public class S3StorageService implements StorageService {

    private static final long AUTO_PART_SIZE = -1;

    private final MinioClient client;
    private final String bucket;

    public S3StorageService(StorageProperties properties) {
        this.client = MinioClient.builder()
                .endpoint(properties.endpoint())
                .credentials(properties.accessKey(), properties.secretKey())
                .build();
        this.bucket = properties.bucket();
    }

    @Override
    public void store(String key, InputStream content, long size, String contentType) {
        ensureBucket();
        try {
            client.putObject(PutObjectArgs.builder().bucket(bucket).object(key).stream(content, size, AUTO_PART_SIZE)
                    .contentType(contentType != null ? contentType : "application/octet-stream")
                    .build());
        } catch (Exception e) {
            throw new StorageException("Échec de l'écriture de l'objet " + key, e);
        }
    }

    @Override
    public InputStream retrieve(String key) {
        try {
            return client.getObject(
                    GetObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception e) {
            throw new StorageException("Échec de la lecture de l'objet " + key, e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            client.removeObject(
                    RemoveObjectArgs.builder().bucket(bucket).object(key).build());
        } catch (Exception e) {
            throw new StorageException("Échec de la suppression de l'objet " + key, e);
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            client.statObject(
                    StatObjectArgs.builder().bucket(bucket).object(key).build());
            return true;
        } catch (ErrorResponseException e) {
            return false;
        } catch (Exception e) {
            throw new StorageException("Échec de la vérification de l'objet " + key, e);
        }
    }

    private void ensureBucket() {
        try {
            boolean present = client.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build());
            if (!present) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception e) {
            throw new StorageException("Bucket " + bucket + " indisponible", e);
        }
    }
}
