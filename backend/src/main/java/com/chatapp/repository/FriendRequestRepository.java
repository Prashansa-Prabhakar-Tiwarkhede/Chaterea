package com.chatapp.repository;

import com.chatapp.entity.FriendRequest;
import com.chatapp.enums.FriendRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, UUID> {
    List<FriendRequest> findByReceiverIdAndStatus(UUID receiverId, FriendRequestStatus status);
    List<FriendRequest> findBySenderIdAndStatus(UUID senderId, FriendRequestStatus status);
    Optional<FriendRequest> findBySenderIdAndReceiverId(UUID senderId, UUID receiverId);
}
