package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "message_keys")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageKey {

    @Id @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    // AES-256 session key, RSA-OAEP encrypted with recipient's public key, base64.
    @Column(name = "encrypted_aes_key", nullable = false, columnDefinition = "TEXT")
    private String encryptedAesKey;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
