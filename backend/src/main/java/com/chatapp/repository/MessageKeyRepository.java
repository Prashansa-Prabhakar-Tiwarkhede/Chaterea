package com.chatapp.repository;

import com.chatapp.entity.MessageKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MessageKeyRepository extends JpaRepository<MessageKey, UUID> {
    Optional<MessageKey> findByMessageIdAndRecipientId(UUID messageId, UUID recipientId);
}
