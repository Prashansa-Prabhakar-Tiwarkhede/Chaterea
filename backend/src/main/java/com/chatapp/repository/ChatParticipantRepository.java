package com.chatapp.repository;

import com.chatapp.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, UUID> {
    List<ChatParticipant> findByUserId(UUID userId);
    List<ChatParticipant> findByChatId(UUID chatId);
    Optional<ChatParticipant> findByChatIdAndUserId(UUID chatId, UUID userId);

    /** Finds an existing 1:1 DIRECT chat shared by exactly these two users, if one exists. */
    @Query("""
        SELECT cp1.chat.id FROM ChatParticipant cp1
        JOIN ChatParticipant cp2 ON cp1.chat.id = cp2.chat.id
        WHERE cp1.user.id = :userA AND cp2.user.id = :userB AND cp1.chat.type = com.chatapp.enums.ChatType.DIRECT
        """)
    Optional<UUID> findDirectChatIdBetween(@Param("userA") UUID userA, @Param("userB") UUID userB);
}
