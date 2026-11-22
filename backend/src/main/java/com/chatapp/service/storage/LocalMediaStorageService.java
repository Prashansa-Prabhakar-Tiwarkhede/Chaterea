package com.chatapp.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/**
 * Development/demo storage: writes uploaded files to a local directory and
 * serves them back via MediaController's GET /api/media/files/{filename}.
 * NOT suitable for most production hosts with ephemeral disks — see
 * MediaStorageService's javadoc for the Supabase Storage swap-in.
 */
@Service
@Slf4j
public class LocalMediaStorageService implements MediaStorageService {

    @Value("${app.storage.local-dir:./uploaded-media}")
    private String localDir;

    @Value("${app.public-base-url:http://localhost:8080}")
    private String publicBaseUrl;

    @Override
    public StoredFile store(MultipartFile file) throws IOException {
        Path dir = Path.of(localDir);
        Files.createDirectories(dir);

        String extension = extractExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + (extension.isBlank() ? "" : "." + extension);
        Path destination = dir.resolve(filename);
        file.transferTo(destination.toFile());

        String url = publicBaseUrl + "/api/media/files/" + filename;
        String thumbnailUrl = null;

        if (file.getContentType() != null && file.getContentType().startsWith("image/")) {
            thumbnailUrl = generateThumbnail(destination.toFile(), dir, filename);
        }

        return new StoredFile(url, thumbnailUrl);
    }

    private String generateThumbnail(File original, Path dir, String filename) {
        try {
            BufferedImage sourceImage = ImageIO.read(original);
            if (sourceImage == null) return null; // not a raster format ImageIO understands (e.g. some SVGs)

            int targetWidth = 256;
            int targetHeight = (int) (sourceImage.getHeight() * (targetWidth / (double) sourceImage.getWidth()));

            BufferedImage thumbnail = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = thumbnail.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(sourceImage, 0, 0, targetWidth, targetHeight, null);
            g.dispose();

            String thumbFilename = "thumb_" + filename;
            File thumbFile = dir.resolve(thumbFilename).toFile();
            String format = filename.contains(".") ? filename.substring(filename.lastIndexOf('.') + 1) : "png";
            ImageIO.write(thumbnail, format.equalsIgnoreCase("jpg") ? "jpg" : "png", thumbFile);

            return publicBaseUrl + "/api/media/files/" + thumbFilename;
        } catch (Exception e) {
            log.warn("Thumbnail generation failed for {}: {}", filename, e.getMessage());
            return null;
        }
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) return "";
        return originalFilename.substring(originalFilename.lastIndexOf('.') + 1);
    }
}
