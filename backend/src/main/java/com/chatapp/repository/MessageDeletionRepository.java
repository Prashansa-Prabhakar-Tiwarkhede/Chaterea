package com.chatapp.repository;

import com.chatapp.entity.MessageDeletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MessageDeletionRepository extends JpaRepository<MessageDeletion, UUID> {
    Optional<MessageDeletion> findByMessageIdAndUserId(UUID messageId, UUID userId);
}
