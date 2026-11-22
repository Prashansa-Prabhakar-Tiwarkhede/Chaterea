package com.chatapp.controller;

import com.chatapp.dto.chat.*;
import com.chatapp.security.CustomUserDetails;
import com.chatapp.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/direct")
    public ResponseEntity<ChatSummaryResponse> getOrCreateDirect(@Valid @RequestBody CreateDirectChatRequest request,
                                                                   @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(chatService.getOrCreateDirectChat(principal.getId(), request));
    }

    @GetMapping
    public ResponseEntity<List<ChatSummaryResponse>> listMyChats(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(chatService.listMyChats(principal.getId()));
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageResponse> sendMessage(@Valid @RequestBody SendMessageRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(chatService.sendMessage(principal.getId(), request));
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<Page<MessageResponse>> getHistory(@PathVariable UUID chatId,
                                                              @AuthenticationPrincipal CustomUserDetails principal,
                                                              Pageable pageable) {
        return ResponseEntity.ok(chatService.getHistory(chatId, principal.getId(), pageable));
    }

    @PatchMapping("/messages/{messageId}")
    public ResponseEntity<MessageResponse> editMessage(@PathVariable UUID messageId,
                                                         @Valid @RequestBody EditMessageRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(chatService.editMessage(messageId, principal.getId(), request));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable UUID messageId,
                                                @Valid @RequestBody DeleteMessageRequest request,
                                                @AuthenticationPrincipal CustomUserDetails principal) {
        chatService.deleteMessage(messageId, principal.getId(), request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/messages/{messageId}/seen")
    public ResponseEntity<Void> markSeen(@PathVariable UUID messageId,
                                          @AuthenticationPrincipal CustomUserDetails principal) {
        chatService.markSeen(messageId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
