package com.datashare.support;

import org.springframework.context.annotation.Import;

/** Base des tests d'intégration ayant besoin du stockage objet (PostgreSQL + MinIO). */
@Import(MinioTestcontainersConfiguration.class)
public abstract class AbstractStorageIntegrationTest extends AbstractIntegrationTest {}
