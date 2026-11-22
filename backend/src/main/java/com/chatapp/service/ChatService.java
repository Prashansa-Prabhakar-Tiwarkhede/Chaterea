package com.chatapp.service;

import com.chatapp.dto.chat.*;
import com.chatapp.entity.*;
import com.chatapp.enums.ChatType;
import com.chatapp.enums.MessageType;
import com.chatapp.enums.NotificationType;
import com.chatapp.exception.BadRequestException;
import com.chatapp.exception.ForbiddenException;
import com.chatapp.exception.NotFoundException;
import com.chatapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRepository chatRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final MessageRepository messageRepository;
    private final MessageKeyRepository messageKeyRepository;
    private final MessageDeletionRepository messageDeletionRepository;
    private final MessageReadReceiptRepository messageReadReceiptRepository;
    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;

    private final FriendService friendService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    // ------------------------------------------------------------------
    // Chat creation / listing
    // ------------------------------------------------------------------
    @Transactional
    public ChatSummaryResponse getOrCreateDirectChat(UUID currentUserId, CreateDirectChatRequest request) {
        if (currentUserId.equals(request.otherUserId())) {
            throw new BadRequestException("Cannot start a chat with yourself");
        }
        if (friendService.isBlockedEitherWay(currentUserId, request.otherUserId())) {
            throw new ForbiddenException("Cannot start a chat with this user");
        }

        User other = userRepository.findById(request.otherUserId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        UUID existingChatId = chatParticipantRepository
                .findDirectChatIdBetween(currentUserId, other.getId())
                .orElse(null);

        Chat chat;
        if (existingChatId != null) {
            chat = chatRepository.findById(existingChatId).orElseThrow();
        } else {
            User self = userRepository.getReferenceById(currentUserId);
            chat = chatRepository.save(Chat.builder().type(ChatType.DIRECT).build());

            chatParticipantRepository.save(ChatParticipant.builder().chat(chat).user(self).build());
            chatParticipantRepository.save(ChatParticipant.builder().chat(chat).user(other).build());
        }

        return toChatSummary(chat, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<ChatSummaryResponse> listMyChats(UUID currentUserId) {
        return chatParticipantRepository.findByUserId(currentUserId).stream()
                .map(cp -> toChatSummary(cp.getChat(), currentUserId))
                .toList();
    }

    private ChatSummaryResponse toChatSummary(Chat chat, UUID currentUserId) {
        if (chat.getType() == ChatType.DIRECT) {
            User other = chatParticipantRepository.findByChatId(chat.getId()).stream()
                    .map(ChatParticipant::getUser)
                    .filter(u -> !u.getId().equals(currentUserId))
                    .findFirst()
                    .orElse(null);
            return new ChatSummaryResponse(chat.getId(), "DIRECT",
                    other != null ? other.getId() : null,
                    other != null ? other.getDisplayName() : null,
                    null, null, chat.getLastMessageAt());
        } else {
            Group group = chat.getGroup();
            return new ChatSummaryResponse(chat.getId(), "GROUP", null, null,
                    group != null ? group.getId() : null,
                    group != null ? group.getName() : null,
                    chat.getLastMessageAt());
        }
    }

    // ------------------------------------------------------------------
    // Sending
    // ------------------------------------------------------------------
    @Transactional
    public MessageResponse sendMessage(UUID senderId, SendMessageRequest request) {
        ChatParticipant participation = chatParticipantRepository
                .findByChatIdAndUserId(request.chatId(), senderId)
                .orElseThrow(() -> new ForbiddenException("You are not a participant of this chat"));

        Chat chat = participation.getChat();
        User sender = userRepository.getReferenceById(senderId);

        List<ChatParticipant> participants = chatParticipantRepository.findByChatId(chat.getId());

        // For direct chats, refuse if either side has blocked the other.
        if (chat.getType() == ChatType.DIRECT) {
            UUID otherId = participants.stream().map(p -> p.getUser().getId())
                    .filter(id -> !id.equals(senderId)).findFirst().orElse(null);
            if (otherId != null && friendService.isBlockedEitherWay(senderId, otherId)) {
                throw new ForbiddenException("You cannot message this user");
            }
        }

        Message message = Message.builder()
                .chat(chat)
                .sender(sender)
                .messageType(parseMessageType(request.messageType()))
                .ciphertext(request.ciphertext())
                .iv(request.iv())
                .signature(request.signature())
                .mediaUrl(request.mediaUrl())
                .mediaMimeType(request.mediaMimeType())
                .mediaSizeBytes(request.mediaSizeBytes())
                .thumbnailUrl(request.thumbnailUrl())
                .build();

        if (request.replyToMessageId() != null) {
            messageRepository.findById(request.replyToMessageId()).ifPresent(message::setReplyToMessage);
        }

        message = messageRepository.save(message);

        // Persist the per-recipient RSA-wrapped AES key (E2EE fan-out).
        for (RecipientKeyDto rk : request.recipientKeys()) {
            messageKeyRepository.save(MessageKey.builder()
                    .message(message)
                    .recipient(userRepository.getReferenceById(rk.recipientId()))
                    .encryptedAesKey(rk.encryptedAesKey())
                    .build());
        }

        chat.setLastMessageAt(Instant.now());
        chatRepository.save(chat);

        // Broadcast to the chat topic (everyone subscribed gets the raw
        // ciphertext row appropriate to them looked up client-side via /api).
        Message finalMessage = message;
        for (ChatParticipant p : participants) {
            if (p.getUser().getId().equals(senderId)) continue;

            MessageResponse forRecipient = toMessageResponse(finalMessage, p.getUser().getId());
            messagingTemplate.convertAndSend("/topic/chats/" + chat.getId(), forRecipient);
            messagingTemplate.convertAndSendToUser(p.getUser().getId().toString(), "/queue/notifications-preview",
                    Map.of("chatId", chat.getId().toString(), "messageId", finalMessage.getId().toString()));

            notificationService.notify(p.getUser().getId(), NotificationType.NEW_MESSAGE, Map.of(
                    "chatId", chat.getId().toString(),
                    "fromUserId", senderId.toString(),
                    "fromDisplayName", sender.getDisplayName()
            ));
        }

        return toMessageResponse(message, senderId);
    }

    private MessageType parseMessageType(String raw) {
        try {
            return MessageType.valueOf(raw);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid message type: " + raw);
        }
    }

    // ------------------------------------------------------------------
    // History
    // ------------------------------------------------------------------
    @Transactional(readOnly = true)
    public Page<MessageResponse> getHistory(UUID chatId, UUID currentUserId, Pageable pageable) {
        chatParticipantRepository.findByChatIdAndUserId(chatId, currentUserId)
                .orElseThrow(() -> new ForbiddenException("You are not a participant of this chat"));

        return messageRepository.findByChatIdOrderByCreatedAtDesc(chatId, pageable)
                .map(m -> toMessageResponse(m, currentUserId))
                .map(m -> hideIfDeletedForMe(m, currentUserId));
    }

    private MessageResponse hideIfDeletedForMe(MessageResponse response, UUID userId) {
        boolean deletedForMe = messageDeletionRepository != null &&
                messageDeletionRepository.findByMessageIdAndUserId(response.id(), userId).isPresent();
        if (!deletedForMe) return response;
        return new MessageResponse(response.id(), response.chatId(), response.senderId(), response.senderDisplayName(),
                response.messageType(), null, null, null, null, null, null, null, null,
                                response.edited(), true, response.replyToMessageId(), response.createdAt());
    }

    // ------------------------------------------------------------------
    // Edit / Delete
    // ------------------------------------------------------------------
    @Transactional
    public MessageResponse editMessage(UUID messageId, UUID currentUserId, EditMessageRequest request) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message not found"));

        if (!message.getSender().getId().equals(currentUserId)) {
            throw new ForbiddenException("You can only edit your own messages");
        }
        if (message.isDeletedForEveryone()) {
            throw new BadRequestException("Cannot edit a deleted message");
        }

        message.setCiphertext(request.ciphertext());
        message.setIv(request.iv());
        message.setSignature(request.signature());
        message.setEdited(true);
        message.setEditedAt(Instant.now());
        message = messageRepository.save(message);

        messagingTemplate.convertAndSend("/topic/chats/" + message.getChat().getId(),
                Map.of("type", "MESSAGE_EDITED", "messageId", message.getId().toString()));

        return toMessageResponse(message, currentUserId);
    }

    @Transactional
    public void deleteMessage(UUID messageId, UUID currentUserId, DeleteMessageRequest request) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message not found"));

        if (request.scope() == DeleteMessageRequest.DeleteScope.FOR_EVERYONE) {
            if (!message.getSender().getId().equals(currentUserId)) {
                throw new ForbiddenException("You can only delete your own messages for everyone");
            }
            message.setDeletedForEveryone(true);
            message.setDeletedAt(Instant.now());
            message.setCiphertext("");
            message.setSignature("");
            messageRepository.save(message);

            messagingTemplate.convertAndSend("/topic/chats/" + message.getChat().getId(),
                    Map.of("type", "MESSAGE_DELETED", "messageId", message.getId().toString()));
        } else {
            chatParticipantRepository.findByChatIdAndUserId(message.getChat().getId(), currentUserId)
                    .orElseThrow(() -> new ForbiddenException("You are not a participant of this chat"));

            if (messageDeletionRepository.findByMessageIdAndUserId(messageId, currentUserId).isEmpty()) {
                messageDeletionRepository.save(MessageDeletion.builder()
                        .message(message)
                        .user(userRepository.getReferenceById(currentUserId))
                        .build());
            }
        }
    }

    // ------------------------------------------------------------------
    // Read receipts
    // ------------------------------------------------------------------
    @Transactional
    public void markSeen(UUID messageId, UUID currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message not found"));

        MessageReadReceipt receipt = messageReadReceiptRepository
                .findByMessageIdAndUserId(messageId, currentUserId)
                .orElseGet(() -> MessageReadReceipt.builder()
                        .message(message)
                        .user(userRepository.getReferenceById(currentUserId))
                        .build());

        receipt.setSeenAt(Instant.now());
        if (receipt.getDeliveredAt() == null) {
            receipt.setDeliveredAt(Instant.now());
        }
        messageReadReceiptRepository.save(receipt);

        ChatParticipant participant = chatParticipantRepository
                .findByChatIdAndUserId(message.getChat().getId(), currentUserId).orElse(null);
        if (participant != null) {
            participant.setLastReadAt(Instant.now());
            chatParticipantRepository.save(participant);
        }

        messagingTemplate.convertAndSend("/topic/chats/" + message.getChat().getId(),
                new ReadReceiptBroadcast(message.getChat().getId(), messageId, currentUserId, Instant.now()));
    }

    // ------------------------------------------------------------------
    private MessageResponse toMessageResponse(Message m, UUID forUserId) {
        String keyForMe = messageKeyRepository.findByMessageIdAndRecipientId(m.getId(), forUserId)
                .map(MessageKey::getEncryptedAesKey)
                .orElse(null);

        return new MessageResponse(
                m.getId(), m.getChat().getId(), m.getSender().getId(), m.getSender().getDisplayName(),
                m.getMessageType().name(),
                m.isDeletedForEveryone() ? null : m.getCiphertext(),
                m.isDeletedForEveryone() ? null : m.getIv(),
                m.isDeletedForEveryone() ? null : m.getSignature(),
                keyForMe,
                m.getMediaUrl(), m.getMediaMimeType(), m.getMediaSizeBytes(), m.getThumbnailUrl(),
                m.isEdited(), m.isDeletedForEveryone(),
                m.getReplyToMessage() != null ? m.getReplyToMessage().getId() : null,
                m.getCreatedAt()
        );
    }
}
