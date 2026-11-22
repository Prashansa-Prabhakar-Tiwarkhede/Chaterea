package com.chatapp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@ConfigurationProperties(prefix = "app.storage")
@Getter
@Setter
public class StorageProperties {
    private String supabaseUrl;
    private String supabaseServiceKey;
    private String bucket;
    private int maxFileSizeMb;
    private String allowedMimeTypes; // comma-separated, as in application.yml

    public Set<String> allowedMimeTypeSet() {
        return List.of(allowedMimeTypes.split(",")).stream().map(String::trim).collect(Collectors.toSet());
    }

    public long maxFileSizeBytes() {
        return (long) maxFileSizeMb * 1024 * 1024;
    }
}
