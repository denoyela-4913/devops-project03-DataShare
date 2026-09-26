package com.datashare.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.utility.DockerImageName;

/** Conteneur MinIO jetable pour les tests de stockage (importé uniquement par ceux qui en ont besoin). */
@TestConfiguration(proxyBeanMethods = false)
public class MinioTestcontainersConfiguration {

    @Bean
    MinIOContainer minioContainer() {
        // minio/minio a été retiré de Docker Hub (10/2025), quay.io/minio est passé privé (09/2026)
        // et pgsty/minio est gelé (renommé pgsty/silo). Image construite depuis notre fork
        // denoyela-4913/silo, publiée sur GHCR, tag explicite (voir deploy/docker-compose.yml).
        // asCompatibleSubstituteFor requis : MinIOContainer valide le nom de l'image.
        return new MinIOContainer(DockerImageName.parse("ghcr.io/denoyela-4913/silo:RELEASE.2026-09-16T00-00-00Z")
                .asCompatibleSubstituteFor("minio/minio"));
    }

    @Bean
    DynamicPropertyRegistrar minioProperties(MinIOContainer minio) {
        return registry -> {
            registry.add("datashare.storage.endpoint", minio::getS3URL);
            registry.add("datashare.storage.access-key", minio::getUserName);
            registry.add("datashare.storage.secret-key", minio::getPassword);
            registry.add("datashare.storage.bucket", () -> "datashare-test");
        };
    }
}
