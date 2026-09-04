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
        return new MinIOContainer(DockerImageName.parse("minio/minio:latest"));
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
