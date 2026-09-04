package com.datashare.file;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoredFileRepository extends JpaRepository<StoredFile, UUID> {

    Optional<StoredFile> findByDownloadToken(String downloadToken);

    List<StoredFile> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
