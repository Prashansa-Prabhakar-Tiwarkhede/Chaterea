package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "public_keys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicKey {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "public_key", nullable = false, columnDefinition = "TEXT")
    private String publicKeyPem;

    @Column(name = "key_algorithm", nullable = false, length = 20)
    @Builder.Default
    private String keyAlgorithm = "RSA-OAEP-2048";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
