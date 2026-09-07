package com.datashare.integration.maintenance;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

/**
 * Valide le wrapper {@code deploy/purge-expired.sh} en mode {@code --check} : le script
 * s'exécute sous {@code set -euo pipefail}, résout le jar et assemble la bonne commande —
 * sans démarrer Spring ni toucher à la base.
 *
 * <p>Le chemin est relatif (répertoire de travail = {@code backend/}) et en slashes, pour
 * que {@code bash} le résolve quel que soit l'OS.
 */
class PurgeWrapperIT {

    private static final String SCRIPT = "../deploy/purge-expired.sh";

    @Test
    void le_wrapper_check_resout_le_jar_et_le_profil_de_purge() throws IOException, InterruptedException {
        assertThat(Files.isRegularFile(Path.of(SCRIPT)))
                .as("script présent : " + SCRIPT)
                .isTrue();
        assumeTrue(bashAvailable(), "bash indisponible sur cette machine");

        Process process = new ProcessBuilder("bash", SCRIPT, "--check")
                .redirectErrorStream(true)
                .start();
        String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exitCode = process.waitFor();

        assertThat(exitCode).as(output).isZero();
        assertThat(output).contains("--spring.profiles.active=dev,purge");
        assertThat(output).contains("datashare-backend-").contains(".jar");
    }

    private static boolean bashAvailable() {
        try {
            return new ProcessBuilder("bash", "-c", "exit 0").start().waitFor() == 0;
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}
