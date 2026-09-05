package com.datashare.integration.file;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.datashare.file.DownloadTokens;
import com.datashare.file.StoredFile;
import com.datashare.file.StoredFileRepository;
import com.datashare.storage.StorageService;
import com.datashare.support.AbstractStorageIntegrationTest;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@AutoConfigureMockMvc
@Transactional
class DownloadControllerIT extends AbstractStorageIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StoredFileRepository files;

    @Autowired
    private StorageService storage;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String seed(String name, byte[] bytes, String rawPassword, Instant expiresAt) {
        String token = DownloadTokens.generate();
        String key = UUID.randomUUID().toString();
        storage.store(key, new ByteArrayInputStream(bytes), bytes.length, "application/pdf");
        files.saveAndFlush(new StoredFile(
                token,
                name,
                "application/pdf",
                bytes.length,
                key,
                rawPassword == null ? null : passwordEncoder.encode(rawPassword),
                null,
                expiresAt));
        return token;
    }

    private static Instant inOneDay() {
        return Instant.now().plus(1, ChronoUnit.DAYS);
    }

    @Test
    void metadata_returns_200_with_file_info() throws Exception {
        String token = seed("rapport.pdf", "hello world".getBytes(), "secret6", inOneDay());

        mockMvc.perform(get("/api/d/{token}", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("rapport.pdf"))
                .andExpect(jsonPath("$.sizeBytes").value(11))
                .andExpect(jsonPath("$.passwordProtected").value(true));
    }

    @Test
    void metadata_of_an_unknown_token_returns_404() throws Exception {
        mockMvc.perform(get("/api/d/{token}", "does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }

    @Test
    void metadata_of_an_expired_link_returns_410() throws Exception {
        String token = seed("old.pdf", new byte[] {1}, null, Instant.now().minus(1, ChronoUnit.HOURS));

        mockMvc.perform(get("/api/d/{token}", token))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.code").value("EXPIRED"));
    }

    @Test
    void download_of_a_public_file_returns_the_bytes_as_attachment() throws Exception {
        String token = seed("rapport.pdf", "hello world".getBytes(), null, inOneDay());

        mockMvc.perform(post("/api/d/{token}", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("rapport.pdf")))
                .andExpect(content().bytes("hello world".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void download_of_a_protected_file_with_the_right_password_returns_the_bytes() throws Exception {
        String token = seed("secret.pdf", "top secret".getBytes(), "secret6", inOneDay());

        mockMvc.perform(post("/api/d/{token}", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"secret6\"}"))
                .andExpect(status().isOk())
                .andExpect(content().bytes("top secret".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void download_of_a_protected_file_with_a_wrong_password_returns_403() throws Exception {
        String token = seed("secret.pdf", "top secret".getBytes(), "secret6", inOneDay());

        mockMvc.perform(post("/api/d/{token}", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"password\":\"nope\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void download_of_an_unknown_token_returns_404() throws Exception {
        mockMvc.perform(post("/api/d/{token}", "does-not-exist")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }
}
