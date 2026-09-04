package com.datashare.integration.file;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.datashare.auth.JwtService;
import com.datashare.file.StoredFile;
import com.datashare.file.StoredFileRepository;
import com.datashare.storage.StorageService;
import com.datashare.support.AbstractStorageIntegrationTest;
import com.datashare.user.User;
import com.datashare.user.UserRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@AutoConfigureMockMvc
@Transactional
class FileControllerIT extends AbstractStorageIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private StoredFileRepository files;

    @Autowired
    private StorageService storage;

    @Autowired
    private JwtService jwtService;

    private String bearer;
    private User owner;

    @BeforeEach
    void setUp() {
        owner = users.saveAndFlush(new User("owner@example.com", "hash"));
        bearer = "Bearer " + jwtService.generateToken(owner.getId(), owner.getEmail());
    }

    private MockMultipartHttpServletRequestBuilder upload(String name, byte[] content) {
        return multipart("/api/files").file(new MockMultipartFile("file", name, "application/pdf", content));
    }

    @Test
    void upload_returns_201_persists_metadata_and_stores_the_bytes() throws Exception {
        String json = mockMvc.perform(upload("doc.pdf", "hello world".getBytes())
                        .param("expirationDays", "3")
                        .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.name").value("doc.pdf"))
                .andExpect(jsonPath("$.sizeBytes").value(11))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String token = JsonPath.read(json, "$.token");

        StoredFile stored = files.findByDownloadToken(token).orElseThrow();
        assertThat(stored.getOwnerId()).isEqualTo(owner.getId());
        assertThat(storage.exists(stored.getStorageKey())).isTrue();
    }

    @Test
    void upload_without_a_token_returns_401() throws Exception {
        mockMvc.perform(upload("doc.pdf", new byte[] {1})).andExpect(status().isUnauthorized());
    }

    @Test
    void upload_of_a_blocked_extension_returns_400() throws Exception {
        mockMvc.perform(upload("payload.exe", new byte[] {1}).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FORBIDDEN_FILE_TYPE"));
    }

    @Test
    void upload_with_an_out_of_range_expiration_returns_400() throws Exception {
        mockMvc.perform(upload("doc.pdf", new byte[] {1})
                        .param("expirationDays", "30")
                        .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_EXPIRATION"));
    }

    @Test
    void upload_with_a_short_file_password_returns_400() throws Exception {
        mockMvc.perform(upload("doc.pdf", new byte[] {1})
                        .param("password", "123")
                        .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION"));
    }
}
