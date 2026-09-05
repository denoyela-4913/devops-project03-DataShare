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

    @BeforeEach
    void setUp() {
        FileProperties props =
                new FileProperties(1_073_741_824L, 7, 7, List.of("exe", "bat", "sh"), "http://localhost:8080/d");
        service = new FileService(files, storage, passwordEncoder, props);
        Mockito.lenient().when(files.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static MultipartFile file(String name, byte[] content) {
        return new MockMultipartFile("file", name, "application/octet-stream", content);
    }

    @Test
    void upload_stores_bytes_persists_metadata_and_returns_a_link() {
        UploadResponse response = service.upload(file("rapport.pdf", "hello".getBytes()), null, null, OWNER);

        verify(storage).store(anyString(), any(), eq(5L), eq("application/octet-stream"));
        ArgumentCaptor<StoredFile> saved = ArgumentCaptor.forClass(StoredFile.class);
        verify(files).save(saved.capture());
        assertThat(saved.getValue().getOriginalName()).isEqualTo("rapport.pdf");
        assertThat(saved.getValue().getOwnerId()).isEqualTo(OWNER);
        assertThat(saved.getValue().getExpiresAt()).isAfter(Instant.now().plusSeconds(6 * 24 * 3600L));
        assertThat(response.downloadUrl()).isEqualTo("http://localhost:8080/d/" + response.token());
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
    void upload_rejects_a_blocked_extension() {
        assertThatThrownBy(() -> service.upload(file("virus.exe", new byte[] {1}), null, null, OWNER))
                .isInstanceOf(ForbiddenFileTypeException.class);
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
}
