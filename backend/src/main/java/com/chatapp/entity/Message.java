package com.chatapp.entity;

import com.chatapp.enums.MessageType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Message {

    @Id @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 20)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    // E2EE: server only stores ciphertext + iv + signature, never plaintext.
    // NOTE: plain @Column(columnDefinition = "TEXT"), NOT @Lob — Hibernate 6
    // maps @Lob String fields to Postgres' "oid" large-object type by
    // default, which does not match the plain TEXT column Flyway created
    // and fails schema validation on startup.
    @Column(nullable = false, columnDefinition = "TEXT")
    private String ciphertext;

    @Column(nullable = false, length = 64)
    private String iv;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String signature;

    @Column(name = "media_url")
    private String mediaUrl;

    @Column(name = "media_mime_type", length = 100)
    private String mediaMimeType;

    @Column(name = "media_size_bytes")
    private Long mediaSizeBytes;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "is_edited", nullable = false)
    @Builder.Default
    private boolean edited = false;

    @Column(name = "edited_at")
    private Instant editedAt;

    @Column(name = "is_deleted_for_everyone", nullable = false)
    @Builder.Default
    private boolean deletedForEveryone = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_message_id")
    private Message replyToMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
