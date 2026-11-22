package com.chatapp.entity;

import com.chatapp.enums.RelationshipType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_relationships")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserRelationship {

    @Id @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "other_user_id", nullable = false)
    private User otherUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RelationshipType relationship;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
