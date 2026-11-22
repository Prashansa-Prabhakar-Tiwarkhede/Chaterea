package com.chatapp.controller;

import com.chatapp.dto.friend.*;
import com.chatapp.security.CustomUserDetails;
import com.chatapp.service.FriendService;
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
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping("/search")
    public ResponseEntity<Page<UserSummaryResponse>> search(@RequestParam String query,
                                                              @AuthenticationPrincipal CustomUserDetails principal,
                                                              Pageable pageable) {
        return ResponseEntity.ok(friendService.searchUsers(query, principal.getId(), pageable));
    }

    @PostMapping("/requests")
    public ResponseEntity<FriendRequestResponse> sendRequest(@Valid @RequestBody SendFriendRequestRequest request,
                                                               @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(friendService.sendRequest(principal.getId(), request));
    }

    @PatchMapping("/requests/{id}")
    public ResponseEntity<FriendRequestResponse> respond(@PathVariable UUID id,
                                                           @Valid @RequestBody RespondFriendRequestRequest body,
                                                           @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(friendService.respond(id, principal.getId(), body));
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<List<FriendRequestResponse>> incoming(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(friendService.incomingRequests(principal.getId()));
    }

    @GetMapping("/requests/outgoing")
    public ResponseEntity<List<FriendRequestResponse>> outgoing(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(friendService.outgoingRequests(principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<UserSummaryResponse>> listFriends(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(friendService.listFriends(principal.getId()));
    }

    @PostMapping("/block")
    public ResponseEntity<Void> block(@Valid @RequestBody BlockUserRequest request,
                                       @AuthenticationPrincipal CustomUserDetails principal) {
        friendService.blockUser(principal.getId(), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/block/{userId}")
    public ResponseEntity<Void> unblock(@PathVariable UUID userId,
                                         @AuthenticationPrincipal CustomUserDetails principal) {
        friendService.unblockUser(principal.getId(), userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/blocked")
    public ResponseEntity<List<UserSummaryResponse>> listBlocked(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(friendService.listBlocked(principal.getId()));
    }
}
