package com.datashare.unit.file;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ResourceNotFoundException;
import com.datashare.file.DownloadPayload;
import com.datashare.file.FileProperties;
import com.datashare.file.FileService;
import com.datashare.file.StoredFile;
import com.datashare.file.StoredFileRepository;
import com.datashare.file.dto.FileMetadataResponse;
import com.datashare.file.dto.UploadResponse;
import com.datashare.file.exception.ExpiredFileException;
import com.datashare.file.exception.FileTooLargeException;
import com.datashare.file.exception.ForbiddenFileTypeException;
import com.datashare.file.exception.InvalidExpirationException;
import com.datashare.file.exception.InvalidFilePasswordException;
import com.datashare.storage.StorageService;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    private static final UUID OWNER = UUID.randomUUID();

    @Mock
    private StoredFileRepository files;

    @Mock
    private StorageService storage;

    @Mock
    private PasswordEncoder passwordEncoder;

    private FileService service;

    /** Même liste que datashare.files.blocked-extensions en application.yml. */
    private static final List<String> BLOCKED_EXTENSIONS = List.of(
            "exe", "bat", "cmd", "com", "scr", "msi", "sh", "ps1", "vbs", "vbe", "js", "jse", "jar", "dll", "app",
            "deb", "rpm");

    @BeforeEach
    void setUp() {
        FileProperties props = new FileProperties(1_073_741_824L, 7, 7, BLOCKED_EXTENSIONS, "http://localhost:8080/d");
        service = new FileService(files, storage, passwordEncoder, props);
        Mockito.lenient().when(files.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    /**
     * Le Content-Type déclaré ici ("application/octet-stream") n'a plus aucune influence sur ce
     * qui est stocké/servi : le type réel est désormais détecté par octets à partir de
     * {@code content} (voir upload_ignores_the_client_declared_content_type_and_stores_the_detected_one).
     */
    private static MultipartFile file(String name, byte[] content) {
        return new MockMultipartFile("file", name, "application/octet-stream", content);
    }

    @Test
    void upload_stores_bytes_persists_metadata_and_returns_a_link() {
        // "hello" n'a aucune signature binaire : Tika le détecte comme text/plain (le contenu
        // réel, pas le Content-Type déclaré par file() — voir
        // upload_ignores_the_client_declared_content_type_and_stores_the_detected_one).
        UploadResponse response = service.upload(file("rapport.pdf", "hello".getBytes()), null, null, OWNER);

        verify(storage).store(anyString(), any(), eq(5L), eq("text/plain"));
        ArgumentCaptor<StoredFile> saved = ArgumentCaptor.forClass(StoredFile.class);
        verify(files).save(saved.capture());
        assertThat(saved.getValue().getOriginalName()).isEqualTo("rapport.pdf");
        assertThat(saved.getValue().getOwnerId()).isEqualTo(OWNER);
        assertThat(saved.getValue().getExpiresAt()).isAfter(Instant.now().plusSeconds(6 * 24 * 3600L));
        assertThat(response.downloadUrl()).isEqualTo("http://localhost:8080/d/" + response.token());
    }

    @Test
    void upload_ignores_the_client_declared_content_type_and_stores_the_detected_one() {
        // Le client ment : il déclare text/html (payload XSS classique), mais envoie un vrai PDF.
        MultipartFile lying = new MockMultipartFile("file", "photo.jpg", "text/html", "%PDF-1.4\n...".getBytes());

        service.upload(lying, null, null, OWNER);

        verify(storage).store(anyString(), any(), anyLong(), eq("application/pdf"));
    }

    @Test
    void upload_rejects_a_file_over_the_size_limit() {
        MultipartFile huge = new MockMultipartFile("file", "big.iso", null, new byte[0]) {
            @Override
            public long getSize() {
                return 2_000_000_000L;
            }
        };
        assertThatThrownBy(() -> service.upload(huge, null, null, OWNER)).isInstanceOf(FileTooLargeException.class);
        verify(storage, never()).store(anyString(), any(), anyLong(), any());
    }

    @Test
    void upload_rejects_every_blocked_extension_by_declared_name() {
        for (String ext : BLOCKED_EXTENSIONS) {
            assertThatThrownBy(() -> service.upload(file("virus." + ext, new byte[] {1}), null, null, OWNER))
                    .as("extension .%s (nom déclaré)", ext)
                    .isInstanceOf(ForbiddenFileTypeException.class);
        }
    }

    // ── Détection du type réel par octets, indépendante de l'extension déclarée ──────────────
    // tika-core (sans tika-parsers) ne reconnaît de façon fiable que les formats binaires avec
    // une signature propre. Les 5 tests suivants couvrent les familles de la liste noire que
    // cette détection rattrape effectivement quand le fichier est renommé avec une extension
    // autorisée. Voir SECURITY.md pour la limite : msi/jar/scripts texte (ps1, vbs, vbe, js,
    // jse) n'ont pas de signature exploitable par cette bibliothèque légère — documenté par
    // upload_does_not_detect_every_blocked_type_by_content_known_tika_core_limitation ci-dessous.

    /** En-tête PE minimal (MZ + pointeur e_lfanew vers "PE\0\0") — famille exe/dll/com/scr. */
    private static byte[] peHeader() {
        byte[] header = new byte[0x80];
        header[0] = 'M';
        header[1] = 'Z';
        header[0x3C] = 0x40; // e_lfanew : offset de la signature PE
        header[0x40] = 'P';
        header[0x41] = 'E';
        return header;
    }

    @Test
    void upload_rejects_a_windows_executable_renamed_with_an_allowed_extension() {
        assertThatThrownBy(() -> service.upload(file("photo.pdf", peHeader()), null, null, OWNER))
                .as("signature PE détectée malgré l'extension .pdf déclarée")
                .isInstanceOf(ForbiddenFileTypeException.class);
    }

    @Test
    void upload_rejects_a_batch_script_renamed_with_an_allowed_extension() {
        byte[] bat = "@echo off\r\necho hi\r\n".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> service.upload(file("photo.pdf", bat), null, null, OWNER))
                .isInstanceOf(ForbiddenFileTypeException.class);
    }

    @Test
    void upload_rejects_a_shell_script_renamed_with_an_allowed_extension() {
        byte[] shebang = "#!/bin/sh\necho hi".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> service.upload(file("photo.pdf", shebang), null, null, OWNER))
                .isInstanceOf(ForbiddenFileTypeException.class);
    }

    @Test
    void upload_rejects_a_debian_package_renamed_with_an_allowed_extension() {
        byte[] ar = "!<arch>\ndebian-binary   0           0     0     100644  4         `\n2.0\n"
                .getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> service.upload(file("photo.pdf", ar), null, null, OWNER))
                .isInstanceOf(ForbiddenFileTypeException.class);
    }

    @Test
    void upload_rejects_an_rpm_package_renamed_with_an_allowed_extension() {
        byte[] rpmLead = {(byte) 0xED, (byte) 0xAB, (byte) 0xEE, (byte) 0xDB, 0, 0, 0, 0};
        assertThatThrownBy(() -> service.upload(file("photo.pdf", rpmLead), null, null, OWNER))
                .isInstanceOf(ForbiddenFileTypeException.class);
    }

    @Test
    void upload_does_not_detect_every_blocked_type_by_content_known_tika_core_limitation() {
        // msi (conteneur OLE, indiscernable de .doc/.xls par simple préfixe d'octets) et les
        // scripts texte sans shebang (ps1/vbs/vbe/js/jse) passent la détection par octets s'ils
        // sont renommés — seul le nom de fichier déclaré les arrête (voir
        // upload_rejects_every_blocked_extension_by_declared_name). Test volontairement présent
        // pour rendre cette limite visible si une évolution future (tika-parsers, ou autre) la
        // comble : il faudra alors le mettre à jour en toute conscience plutôt que de découvrir
        // le changement de comportement par hasard.
        byte[] oleContainer = {(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0, (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1
        };
        byte[] powershell = "Write-Host 'hi'".getBytes(StandardCharsets.UTF_8);

        // Ne lève pas : upload() retourne normalement, preuve que la détection par octets n'a
        // rien bloqué (le nom de fichier déclaré, .pdf ici, est autorisé).
        UploadResponse msiUpload = service.upload(file("photo.pdf", oleContainer), null, null, OWNER);
        UploadResponse ps1Upload = service.upload(file("photo.pdf", powershell), null, null, OWNER);

        assertThat(msiUpload)
                .as(".msi renommé .pdf : passe la détection par octets (limite connue)")
                .isNotNull();
        assertThat(ps1Upload)
                .as(".ps1 renommé .pdf : passe la détection par octets (limite connue)")
                .isNotNull();
    }

    @Test
    void upload_rejects_an_expiration_out_of_bounds() {
        assertThatThrownBy(() -> service.upload(file("a.txt", new byte[] {1}), null, 8, OWNER))
                .isInstanceOf(InvalidExpirationException.class);
        assertThatThrownBy(() -> service.upload(file("a.txt", new byte[] {1}), null, 0, OWNER))
                .isInstanceOf(InvalidExpirationException.class);
    }

    @Test
    void upload_hashes_the_optional_password() {
        when(passwordEncoder.encode("secret6")).thenReturn("hashed");
        service.upload(file("a.txt", new byte[] {1}), "secret6", null, OWNER);
        ArgumentCaptor<StoredFile> saved = ArgumentCaptor.forClass(StoredFile.class);
        verify(files).save(saved.capture());
        assertThat(saved.getValue().getPasswordHash()).isEqualTo("hashed");
    }

    @Test
    void upload_rejects_a_password_shorter_than_6() {
        assertThatThrownBy(() -> service.upload(file("a.txt", new byte[] {1}), "12345", null, OWNER))
                .isInstanceOf(ApiException.class);
    }

    // ── US02 : consultation et téléchargement ────────────────────────────────

    private static StoredFile storedFile(String passwordHash, Instant expiresAt) {
        return new StoredFile(
                "tok", "rapport.pdf", "application/pdf", 11L, "storage-key", passwordHash, OWNER, expiresAt);
    }

    private static Instant inOneDay() {
        return Instant.now().plus(1, ChronoUnit.DAYS);
    }

    private static Instant yesterday() {
        return Instant.now().minus(1, ChronoUnit.DAYS);
    }

    @Test
    void metadata_returns_name_size_expiry_and_password_flag() {
        when(files.findByDownloadToken("tok")).thenReturn(Optional.of(storedFile("hash", inOneDay())));

        FileMetadataResponse meta = service.metadata("tok");

        assertThat(meta.name()).isEqualTo("rapport.pdf");
        assertThat(meta.sizeBytes()).isEqualTo(11L);
        assertThat(meta.passwordProtected()).isTrue();
    }

    @Test
    void metadata_of_an_unknown_token_is_a_404() {
        when(files.findByDownloadToken("nope")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.metadata("nope")).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void metadata_of_an_expired_link_is_a_410() {
        when(files.findByDownloadToken("tok")).thenReturn(Optional.of(storedFile(null, yesterday())));
        assertThatThrownBy(() -> service.metadata("tok")).isInstanceOf(ExpiredFileException.class);
    }

    @Test
    void download_of_a_public_file_opens_the_stream() throws Exception {
        when(files.findByDownloadToken("tok")).thenReturn(Optional.of(storedFile(null, inOneDay())));
        when(storage.retrieve("storage-key")).thenReturn(new ByteArrayInputStream("hello world".getBytes()));

        DownloadPayload payload = service.download("tok", null);

        assertThat(payload.filename()).isEqualTo("rapport.pdf");
        assertThat(payload.contentType()).isEqualTo("application/pdf");
        try (InputStream content = payload.content()) {
            assertThat(new String(content.readAllBytes(), StandardCharsets.UTF_8))
                    .isEqualTo("hello world");
        }
    }

    @Test
    void download_of_a_protected_file_needs_the_right_password() {
        when(files.findByDownloadToken("tok")).thenReturn(Optional.of(storedFile("hash", inOneDay())));
        when(passwordEncoder.matches("secret6", "hash")).thenReturn(true);
        when(storage.retrieve("storage-key")).thenReturn(new ByteArrayInputStream(new byte[0]));

        assertThat(service.download("tok", "secret6").filename()).isEqualTo("rapport.pdf");
    }

    @Test
    void download_of_a_protected_file_rejects_a_wrong_password() {
        when(files.findByDownloadToken("tok")).thenReturn(Optional.of(storedFile("hash", inOneDay())));
        when(passwordEncoder.matches("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.download("tok", "wrong")).isInstanceOf(InvalidFilePasswordException.class);
        verify(storage, never()).retrieve(anyString());
    }

    @Test
    void download_of_a_protected_file_rejects_a_missing_password() {
        when(files.findByDownloadToken("tok")).thenReturn(Optional.of(storedFile("hash", inOneDay())));
        when(passwordEncoder.matches("", "hash")).thenReturn(false);

        assertThatThrownBy(() -> service.download("tok", null)).isInstanceOf(InvalidFilePasswordException.class);
    }

    @Test
    void download_of_an_expired_link_is_a_410() {
        when(files.findByDownloadToken("tok")).thenReturn(Optional.of(storedFile(null, yesterday())));
        assertThatThrownBy(() -> service.download("tok", null)).isInstanceOf(ExpiredFileException.class);
    }

    // ── US05 / US06 : historique et suppression ──────────────────────────────

    @Test
    void list_maps_name_size_and_share_link() {
        when(files.findByOwnerIdOrderByCreatedAtDesc(OWNER)).thenReturn(List.of(storedFile("hash", inOneDay())));

        var history = service.list(OWNER);

        assertThat(history).hasSize(1);
        assertThat(history.get(0).name()).isEqualTo("rapport.pdf");
        assertThat(history.get(0).sizeBytes()).isEqualTo(11L);
        assertThat(history.get(0).passwordProtected()).isTrue();
        assertThat(history.get(0).downloadUrl()).isEqualTo("http://localhost:8080/d/tok");
    }

    @Test
    void delete_removes_the_row_and_the_stored_object() {
        StoredFile file = storedFile(null, inOneDay());
        UUID id = UUID.randomUUID();
        when(files.findByIdAndOwnerId(id, OWNER)).thenReturn(Optional.of(file));

        service.delete(id, OWNER);

        verify(files).delete(file);
        verify(storage).delete("storage-key");
    }

    @Test
    void delete_of_an_unknown_or_foreign_file_is_a_404() {
        UUID id = UUID.randomUUID();
        when(files.findByIdAndOwnerId(id, OWNER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id, OWNER)).isInstanceOf(ResourceNotFoundException.class);
        verify(files, never()).delete(any());
        verify(storage, never()).delete(anyString());
    }

    @Test
    void delete_still_succeeds_when_the_storage_deletion_fails() {
        StoredFile file = storedFile(null, inOneDay());
        UUID id = UUID.randomUUID();
        when(files.findByIdAndOwnerId(id, OWNER)).thenReturn(Optional.of(file));
        Mockito.doThrow(new RuntimeException("stockage HS")).when(storage).delete("storage-key");

        service.delete(id, OWNER);

        verify(files).delete(file);
    }
}
