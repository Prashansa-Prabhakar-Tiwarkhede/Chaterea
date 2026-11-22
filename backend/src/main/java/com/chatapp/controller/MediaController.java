package com.chatapp.controller;

import com.chatapp.config.StorageProperties;
import com.chatapp.dto.media.MediaUploadResponse;
import com.chatapp.exception.BadRequestException;
import com.chatapp.service.storage.MediaStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaStorageService mediaStorageService;
    private final StorageProperties storageProperties;

    @Value("${app.storage.local-dir:./uploaded-media}")
    private String localDir;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > storageProperties.maxFileSizeBytes()) {
            throw new BadRequestException("File exceeds the maximum allowed size of "
                    + storageProperties.getMaxFileSizeMb() + "MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !storageProperties.allowedMimeTypeSet().contains(contentType)) {
            throw new BadRequestException("File type not allowed: " + contentType);
        }

        MediaStorageService.StoredFile stored = mediaStorageService.store(file);

        return ResponseEntity.ok(new MediaUploadResponse(
                stored.url(), contentType, file.getSize(), stored.thumbnailUrl()));
    }

    /** Serves locally-stored media back out. Only relevant when using LocalMediaStorageService. */
    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> serve(@PathVariable String filename) throws MalformedURLException {
        Path filePath = Path.of(localDir).resolve(filename).normalize();

        if (!filePath.startsWith(Path.of(localDir).normalize())) {
            // path traversal guard
            return ResponseEntity.badRequest().build();
        }

        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                .body(resource);
    }
}
