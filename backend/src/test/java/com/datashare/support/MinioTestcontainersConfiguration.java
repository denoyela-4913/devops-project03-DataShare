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
        // minio/minio a été retiré de Docker Hub en 10/2025 (MinIO Community est passé
        // source-only), puis quay.io/minio est passé privé (401) en 09/2026 ; pgsty/minio
        // est le fork communautaire compatible, tag explicite (voir deploy/docker-compose.yml).
        // asCompatibleSubstituteFor requis : MinIOContainer valide le nom de l'image.
        return new MinIOContainer(DockerImageName.parse("pgsty/minio:RELEASE.2026-08-04T00-00-00Z")
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
