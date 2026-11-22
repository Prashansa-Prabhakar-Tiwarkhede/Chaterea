package com.chatapp.repository;

import com.chatapp.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ChatRepository extends JpaRepository<Chat, UUID> {
    Optional<Chat> findByGroupId(UUID groupId);
}
