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
        // source-only) ; quay.io/minio est le miroir figé, tag explicite (voir
        // deploy/docker-compose.yml). asCompatibleSubstituteFor requis : MinIOContainer
        // valide aussi le registre de l'image, pas seulement le dépôt.
        return new MinIOContainer(DockerImageName.parse("quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z")
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
