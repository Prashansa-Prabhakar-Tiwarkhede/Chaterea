package com.chatapp.service.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Abstraction over "where uploaded media bytes physically live". The default
 * implementation (LocalMediaStorageService) writes to local disk, which is
 * fine for local development and demos but is NOT durable on most hosting
 * platforms (ephemeral filesystems). For production, implement this
 * interface against Supabase Storage's S3-compatible REST API using
 * app.storage.supabase-url / app.storage.supabase-service-key
 * (see application.yml) and swap the @Primary bean.
 */
public interface MediaStorageService {

    /** Stores the file and returns a publicly-reachable URL for it. */
    StoredFile store(MultipartFile file) throws IOException;

    record StoredFile(String url, String thumbnailUrl) {}
}
