package com.datashare.file;

import com.datashare.common.error.ApiException;
import com.datashare.common.error.ErrorCode;
import com.datashare.file.dto.UploadResponse;
import com.datashare.file.exception.FileTooLargeException;
import com.datashare.file.exception.ForbiddenFileTypeException;
import com.datashare.file.exception.InvalidExpirationException;
import com.datashare.storage.StorageException;
import com.datashare.storage.StorageService;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/** Dépôt d'un fichier (US01) : contrôles de saisie, stockage des octets, persistance des métadonnées. */
@Service
public class FileService {

    private static final int MIN_FILE_PASSWORD_LENGTH = 6;
    private static final int MAX_NAME_LENGTH = 255;

    private final StoredFileRepository files;
    private final StorageService storage;
    private final PasswordEncoder passwordEncoder;
    private final FileProperties properties;

    public FileService(
            StoredFileRepository files,
            StorageService storage,
            PasswordEncoder passwordEncoder,
            FileProperties properties) {
        this.files = files;
        this.storage = storage;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Transactional
    public UploadResponse upload(MultipartFile file, String password, Integer expirationDays, UUID ownerId) {
        long size = file.getSize();
        if (size <= 0) {
            throw new ApiException(ErrorCode.VALIDATION, "Le fichier est vide", "taille = " + size);
        }
        if (size > properties.maxSizeBytes()) {
            throw new FileTooLargeException(size, properties.maxSizeBytes());
        }

        String name = sanitizeFilename(file.getOriginalFilename());
        String extension = extensionOf(name);
        if (properties.blockedExtensionSet().contains(extension)) {
            throw new ForbiddenFileTypeException(extension);
        }

        int days = expirationDays != null ? expirationDays : properties.defaultExpirationDays();
        if (days < 1 || days > properties.maxExpirationDays()) {
            throw new InvalidExpirationException(days, properties.maxExpirationDays());
        }

        String passwordHash = hashPasswordIfPresent(password);

        String token = DownloadTokens.generate();
        String storageKey = UUID.randomUUID().toString();
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        try (InputStream stream = file.getInputStream()) {
            storage.store(storageKey, stream, size, contentType);
        } catch (IOException e) {
            throw new StorageException("Lecture du fichier reçu impossible", e);
        }

        Instant expiresAt = Instant.now().plus(days, ChronoUnit.DAYS);
        StoredFile stored = files.save(
                new StoredFile(token, name, contentType, size, storageKey, passwordHash, ownerId, expiresAt));

        return new UploadResponse(
                properties.baseDownloadUrl() + "/" + token,
                stored.getDownloadToken(),
                stored.getOriginalName(),
                stored.getSizeBytes(),
                stored.getExpiresAt());
    }

    private String hashPasswordIfPresent(String password) {
        if (password == null || password.isBlank()) {
            return null;
        }
        if (password.length() < MIN_FILE_PASSWORD_LENGTH) {
            throw new ApiException(
                    ErrorCode.VALIDATION,
                    "Le mot de passe du fichier doit contenir au moins 6 caractères",
                    "longueur = " + password.length());
        }
        return passwordEncoder.encode(password);
    }

    private static String sanitizeFilename(String raw) {
        if (raw == null || raw.isBlank()) {
            return "fichier";
        }
        String name = raw.replace('\\', '/');
        int slash = name.lastIndexOf('/');
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        name = name.strip();
        if (name.isEmpty()) {
            return "fichier";
        }
        return name.length() > MAX_NAME_LENGTH ? name.substring(name.length() - MAX_NAME_LENGTH) : name;
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 && dot < filename.length() - 1
                ? filename.substring(dot + 1).toLowerCase(Locale.ROOT)
                : "";
    }
}
