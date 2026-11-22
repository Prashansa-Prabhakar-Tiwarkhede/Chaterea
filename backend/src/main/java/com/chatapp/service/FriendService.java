package com.chatapp.service;

import com.chatapp.dto.friend.*;
import com.chatapp.entity.FriendRequest;
import com.chatapp.entity.User;
import com.chatapp.entity.UserRelationship;
import com.chatapp.enums.FriendRequestStatus;
import com.chatapp.enums.NotificationType;
import com.chatapp.enums.RelationshipType;
import com.chatapp.exception.BadRequestException;
import com.chatapp.exception.ConflictException;
import com.chatapp.exception.NotFoundException;
import com.chatapp.repository.FriendRequestRepository;
import com.chatapp.repository.UserRelationshipRepository;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final UserRelationshipRepository userRelationshipRepository;
    private final NotificationService notificationService;

    // ------------------------------------------------------------------
    @Transactional(readOnly = true)
    public Page<UserSummaryResponse> searchUsers(String query, UUID currentUserId, Pageable pageable) {
        return userRepository.search(query, currentUserId, pageable).map(this::toSummary);
    }

    // ------------------------------------------------------------------
    @Transactional
    public FriendRequestResponse sendRequest(UUID senderId, SendFriendRequestRequest request) {
        if (senderId.equals(request.receiverId())) {
            throw new BadRequestException("You cannot send a friend request to yourself");
        }

        User sender = userRepository.findById(senderId).orElseThrow(() -> new NotFoundException("Sender not found"));
        User receiver = userRepository.findById(request.receiverId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (isBlockedEitherWay(senderId, receiver.getId())) {
            throw new BadRequestException("Cannot send a friend request to this user");
        }

        if (userRelationshipRepository.existsByUserIdAndOtherUserIdAndRelationship(
                senderId, receiver.getId(), RelationshipType.FRIEND)) {
            throw new ConflictException("You are already friends with this user");
        }

        friendRequestRepository.findBySenderIdAndReceiverId(senderId, receiver.getId())
                .filter(fr -> fr.getStatus() == FriendRequestStatus.PENDING)
                .ifPresent(fr -> { throw new ConflictException("A friend request is already pending"); });

        FriendRequest fr = FriendRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .status(FriendRequestStatus.PENDING)
                .build();
        fr = friendRequestRepository.save(fr);

        notificationService.notify(receiver.getId(), NotificationType.FRIEND_REQUEST, Map.of(
                "requestId", fr.getId().toString(),
                "fromUserId", sender.getId().toString(),
                "fromDisplayName", sender.getDisplayName()
        ));

        return toResponse(fr);
    }

    @Transactional
    public FriendRequestResponse respond(UUID requestId, UUID currentUserId, RespondFriendRequestRequest body) {
        FriendRequest fr = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Friend request not found"));

        if (!fr.getReceiver().getId().equals(currentUserId)) {
            throw new BadRequestException("You cannot respond to this request");
        }
        if (fr.getStatus() != FriendRequestStatus.PENDING) {
            throw new ConflictException("This request has already been responded to");
        }

        fr.setStatus(body.accept() ? FriendRequestStatus.ACCEPTED : FriendRequestStatus.REJECTED);
        fr.setRespondedAt(Instant.now());
        friendRequestRepository.save(fr);

        if (body.accept()) {
            createMutualFriendship(fr.getSender(), fr.getReceiver());
            notificationService.notify(fr.getSender().getId(), NotificationType.FRIEND_REQUEST_ACCEPTED, Map.of(
                    "byUserId", fr.getReceiver().getId().toString(),
                    "byDisplayName", fr.getReceiver().getDisplayName()
            ));
        }

        return toResponse(fr);
    }

    private void createMutualFriendship(User a, User b) {
        userRelationshipRepository.save(UserRelationship.builder()
                .user(a).otherUser(b).relationship(RelationshipType.FRIEND).build());
        userRelationshipRepository.save(UserRelationship.builder()
                .user(b).otherUser(a).relationship(RelationshipType.FRIEND).build());
    }

    @Transactional(readOnly = true)
    public List<FriendRequestResponse> incomingRequests(UUID userId) {
        return friendRequestRepository.findByReceiverIdAndStatus(userId, FriendRequestStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FriendRequestResponse> outgoingRequests(UUID userId) {
        return friendRequestRepository.findBySenderIdAndStatus(userId, FriendRequestStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listFriends(UUID userId) {
        return userRelationshipRepository.findByUserIdAndRelationship(userId, RelationshipType.FRIEND)
                .stream().map(rel -> toSummary(rel.getOtherUser())).toList();
    }

    // ------------------------------------------------------------------
    @Transactional
    public void blockUser(UUID currentUserId, BlockUserRequest request) {
        if (currentUserId.equals(request.userId())) {
            throw new BadRequestException("You cannot block yourself");
        }
        User self = userRepository.getReferenceById(currentUserId);
        User other = userRepository.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!userRelationshipRepository.existsByUserIdAndOtherUserIdAndRelationship(
                currentUserId, other.getId(), RelationshipType.BLOCKED)) {
            userRelationshipRepository.save(UserRelationship.builder()
                    .user(self).otherUser(other).relationship(RelationshipType.BLOCKED).build());
        }
    }

    @Transactional
    public void unblockUser(UUID currentUserId, UUID otherUserId) {
        userRelationshipRepository.findByUserIdAndOtherUserIdAndRelationship(
                currentUserId, otherUserId, RelationshipType.BLOCKED
        ).ifPresent(userRelationshipRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> listBlocked(UUID userId) {
        return userRelationshipRepository.findByUserIdAndRelationship(userId, RelationshipType.BLOCKED)
                .stream().map(rel -> toSummary(rel.getOtherUser())).toList();
    }

    /** Used by the Chat module to refuse messaging/presence between blocked pairs, in either direction. */
    @Transactional(readOnly = true)
    public boolean isBlockedEitherWay(UUID userA, UUID userB) {
        return userRelationshipRepository.existsByUserIdAndOtherUserIdAndRelationship(userA, userB, RelationshipType.BLOCKED)
                || userRelationshipRepository.existsByUserIdAndOtherUserIdAndRelationship(userB, userA, RelationshipType.BLOCKED);
    }

    // ------------------------------------------------------------------
    private UserSummaryResponse toSummary(User u) {
        return new UserSummaryResponse(
                u.getId(), u.getEmail(), u.getDisplayName(), u.getBio(), u.getProfilePictureUrl(),
                u.isOnline(), u.getLastSeenAt() != null ? u.getLastSeenAt().toString() : null);
    }

    private FriendRequestResponse toResponse(FriendRequest fr) {
        return new FriendRequestResponse(
                fr.getId(), fr.getSender().getId(), fr.getSender().getDisplayName(),
                fr.getReceiver().getId(), fr.getReceiver().getDisplayName(),
                fr.getStatus().name(), fr.getCreatedAt());
    }
}
