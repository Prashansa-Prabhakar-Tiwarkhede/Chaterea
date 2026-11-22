package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "message_read_receipts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageReadReceipt {

    @Id @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "seen_at")
    private Instant seenAt;
}
