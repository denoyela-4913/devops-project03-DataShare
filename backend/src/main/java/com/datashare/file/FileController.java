package com.datashare.file;

import com.datashare.file.dto.FileSummaryResponse;
import com.datashare.file.dto.UploadResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Fichiers d'un utilisateur connecté : dépôt (US01), historique (US05), suppression (US06). */
@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "expirationDays", required = false) Integer expirationDays,
            @AuthenticationPrincipal Jwt jwt) {
        return fileService.upload(file, password, expirationDays, ownerId(jwt));
    }

    @GetMapping
    public List<FileSummaryResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return fileService.list(ownerId(jwt));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        fileService.delete(id, ownerId(jwt));
    }

    private static UUID ownerId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
