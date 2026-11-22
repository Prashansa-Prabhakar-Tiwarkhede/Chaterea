package com.chatapp.repository;

import com.chatapp.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {
    List<GroupMember> findByGroupId(UUID groupId);
    Optional<GroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);
    void deleteByGroupIdAndUserId(UUID groupId, UUID userId);
    long countByGroupIdAndRole(UUID groupId, com.chatapp.enums.GroupRole role);
}
