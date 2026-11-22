package com.chatapp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.jwt")
@Getter
@Setter
public class JwtProperties {
    /** Base64-encoded secret, 256 bits minimum for HS256. */
    private String secret;
    private long accessTokenExpirationMs;
    private long refreshTokenExpirationMs;
    private String issuer;
}
