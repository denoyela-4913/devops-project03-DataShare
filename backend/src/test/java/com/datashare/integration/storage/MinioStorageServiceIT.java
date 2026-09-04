package com.datashare.integration.storage;

import static org.assertj.core.api.Assertions.assertThat;

import com.datashare.storage.StorageService;
import com.datashare.support.AbstractStorageIntegrationTest;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class MinioStorageServiceIT extends AbstractStorageIntegrationTest {

    @Autowired
    private StorageService storage;

    @Test
    void store_then_retrieve_then_delete_roundtrip() throws IOException {
        String key = UUID.randomUUID().toString();
        byte[] content = "contenu de test".getBytes(StandardCharsets.UTF_8);

        storage.store(key, new ByteArrayInputStream(content), content.length, "text/plain");
        assertThat(storage.exists(key)).isTrue();

        try (InputStream in = storage.retrieve(key)) {
            assertThat(in.readAllBytes()).isEqualTo(content);
        }

        storage.delete(key);
        assertThat(storage.exists(key)).isFalse();
    }

    @Test
    void exists_is_false_for_an_unknown_key() {
        assertThat(storage.exists("inexistant-" + UUID.randomUUID())).isFalse();
    }
}
