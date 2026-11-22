package com.chatapp.repository;

import com.chatapp.entity.MessageReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MessageReadReceiptRepository extends JpaRepository<MessageReadReceipt, UUID> {
    Optional<MessageReadReceipt> findByMessageIdAndUserId(UUID messageId, UUID userId);
}
