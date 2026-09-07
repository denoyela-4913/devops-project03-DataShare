package com.datashare.integration.maintenance;

import static org.assertj.core.api.Assertions.assertThat;

import com.datashare.file.DownloadTokens;
import com.datashare.file.StoredFile;
import com.datashare.file.StoredFileRepository;
import com.datashare.maintenance.ExpiredFilePurger;
import com.datashare.maintenance.PurgeReport;
import com.datashare.storage.StorageService;
import com.datashare.support.AbstractStorageIntegrationTest;
import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@Transactional
class ExpiredFilePurgerIT extends AbstractStorageIntegrationTest {

    @Autowired
    private StoredFileRepository files;

    @Autowired
    private StorageService storage;

    private ExpiredFilePurger purger;

    private ExpiredFilePurger purger() {
        if (purger == null) {
            purger = new ExpiredFilePurger(files, storage);
        }
        return purger;
    }

    private String seed(String name, byte[] bytes, Instant expiresAt) {
        String key = UUID.randomUUID().toString();
        storage.store(key, new ByteArrayInputStream(bytes), bytes.length, "application/pdf");
        files.saveAndFlush(new StoredFile(
                DownloadTokens.generate(), name, "application/pdf", bytes.length, key, null, null, expiresAt));
        return key;
    }

    private static Instant yesterday() {
        return Instant.now().minus(1, ChronoUnit.DAYS);
    }

    private static Instant tomorrow() {
        return Instant.now().plus(1, ChronoUnit.DAYS);
    }

    @Test
    void supprime_la_ligne_et_l_objet_des_fichiers_expires_uniquement() {
        String expiredKey = seed("vieux.pdf", "old".getBytes(), yesterday());
        String activeKey = seed("frais.pdf", "new".getBytes(), tomorrow());

        PurgeReport report = purger().purge();

        assertThat(report.deletedCount()).isEqualTo(1);
        assertThat(report.storageFailures()).isZero();
        assertThat(files.count()).isEqualTo(1);
        assertThat(storage.exists(expiredKey)).isFalse();
        assertThat(storage.exists(activeKey)).isTrue();
    }

    @Test
    void ne_fait_rien_sans_fichier_expire() {
        seed("frais.pdf", "x".getBytes(), tomorrow());

        PurgeReport report = purger().purge();

        assertThat(report.deletedCount()).isZero();
        assertThat(files.count()).isEqualTo(1);
    }

    @Test
    void continue_si_l_objet_de_stockage_a_deja_disparu() {
        String key = seed("orphelin.pdf", "x".getBytes(), yesterday());
        storage.delete(key); // objet déjà parti, la ligne reste

        PurgeReport report = purger().purge();

        assertThat(report.deletedCount()).isEqualTo(1);
        assertThat(report.storageFailures()).isZero(); // storage.delete est idempotent
        assertThat(files.count()).isZero();
    }
}
