package com.datashare.file;

import com.datashare.file.dto.DownloadRequest;
import com.datashare.file.dto.FileMetadataResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** US02 — consultation et téléchargement d'un fichier via son lien de partage (accès anonyme). */
@RestController
@RequestMapping("/api/d")
public class DownloadController {

    private final FileService fileService;

    public DownloadController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/{token}")
    public FileMetadataResponse metadata(@PathVariable String token) {
        return fileService.metadata(token);
    }

    @PostMapping("/{token}")
    public ResponseEntity<InputStreamResource> download(
            @PathVariable String token, @RequestBody(required = false) DownloadRequest request) {
        DownloadPayload payload = fileService.download(token, request != null ? request.password() : null);
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(payload.filename(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(mediaType(payload.contentType()))
                .contentLength(payload.sizeBytes())
                .body(new InputStreamResource(payload.content()));
    }

    private static MediaType mediaType(String raw) {
        try {
            return MediaType.parseMediaType(raw);
        } catch (org.springframework.http.InvalidMediaTypeException e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
