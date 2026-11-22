package com.chatapp.dto.media;

public record MediaUploadResponse(
        String url,
        String mimeType,
        long sizeBytes,
        String thumbnailUrl
) {}
