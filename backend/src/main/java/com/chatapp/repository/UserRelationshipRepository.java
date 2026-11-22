package com.chatapp.repository;

import com.chatapp.entity.UserRelationship;
import com.chatapp.enums.RelationshipType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRelationshipRepository extends JpaRepository<UserRelationship, UUID> {
    List<UserRelationship> findByUserIdAndRelationship(UUID userId, RelationshipType relationship);
    Optional<UserRelationship> findByUserIdAndOtherUserIdAndRelationship(UUID userId, UUID otherUserId, RelationshipType relationship);
    boolean existsByUserIdAndOtherUserIdAndRelationship(UUID userId, UUID otherUserId, RelationshipType relationship);
}
