package com.chatapp.service;

import com.chatapp.dto.group.*;
import com.chatapp.entity.*;
import com.chatapp.enums.ChatType;
import com.chatapp.enums.GroupRole;
import com.chatapp.enums.NotificationType;
import com.chatapp.exception.BadRequestException;
import com.chatapp.exception.ForbiddenException;
import com.chatapp.exception.NotFoundException;
import com.chatapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ChatRepository chatRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public GroupResponse createGroup(UUID creatorId, CreateGroupRequest request) {
        User creator = userRepository.findById(creatorId).orElseThrow(() -> new NotFoundException("User not found"));

        Group group = Group.builder()
                .name(request.name())
                .description(request.description())
                .createdBy(creator)
                .build();
        group = groupRepository.save(group);

        Chat chat = chatRepository.save(Chat.builder().type(ChatType.GROUP).group(group).build());

        groupMemberRepository.save(GroupMember.builder().group(group).user(creator).role(GroupRole.OWNER).build());
        chatParticipantRepository.save(ChatParticipant.builder().chat(chat).user(creator).build());

        for (UUID memberId : request.memberIds()) {
            if (memberId.equals(creatorId)) continue;
            User member = userRepository.findById(memberId).orElse(null);
            if (member == null) continue;

            groupMemberRepository.save(GroupMember.builder().group(group).user(member).role(GroupRole.MEMBER).build());
            chatParticipantRepository.save(ChatParticipant.builder().chat(chat).user(member).build());

            notificationService.notify(member.getId(), NotificationType.GROUP_INVITE, Map.of(
                    "groupId", group.getId().toString(),
                    "groupName", group.getName(),
                    "invitedBy", creator.getDisplayName()
            ));
        }

        return toResponse(group, chat.getId());
    }

    @Transactional
    public GroupResponse addMember(UUID groupId, UUID actingUserId, AddGroupMemberRequest request) {
        requireAdminOrOwner(groupId, actingUserId);

        Group group = groupRepository.findById(groupId).orElseThrow(() -> new NotFoundException("Group not found"));
        User newMember = userRepository.findById(request.userId()).orElseThrow(() -> new NotFoundException("User not found"));

        if (groupMemberRepository.findByGroupIdAndUserId(groupId, newMember.getId()).isPresent()) {
            throw new BadRequestException("User is already a member of this group");
        }

        groupMemberRepository.save(GroupMember.builder().group(group).user(newMember).role(GroupRole.MEMBER).build());

        Chat chat = findGroupChat(groupId);
        chatParticipantRepository.save(ChatParticipant.builder().chat(chat).user(newMember).build());

        notificationService.notify(newMember.getId(), NotificationType.GROUP_INVITE, Map.of(
                "groupId", group.getId().toString(), "groupName", group.getName()));

        return toResponse(group, chat.getId());
    }

    @Transactional
    public void removeMember(UUID groupId, UUID actingUserId, UUID targetUserId) {
        // Members can remove themselves (leave); otherwise requires OWNER/ADMIN.
        if (!actingUserId.equals(targetUserId)) {
            requireAdminOrOwner(groupId, actingUserId);
        }

        GroupMember target = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new NotFoundException("This user is not a member of the group"));

        if (target.getRole() == GroupRole.OWNER
                && groupMemberRepository.countByGroupIdAndRole(groupId, GroupRole.OWNER) <= 1) {
            throw new BadRequestException("Cannot remove the last owner of the group");
        }

        groupMemberRepository.delete(target);

        Chat chat = findGroupChat(groupId);
        chatParticipantRepository.findByChatIdAndUserId(chat.getId(), targetUserId)
                .ifPresent(chatParticipantRepository::delete);
    }

    @Transactional
    public GroupResponse updateMemberRole(UUID groupId, UUID actingUserId, UUID targetUserId,
                                            UpdateGroupMemberRoleRequest request) {
        requireOwner(groupId, actingUserId);

        GroupMember target = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new NotFoundException("This user is not a member of the group"));

        GroupRole newRole;
        try {
            newRole = GroupRole.valueOf(request.role());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role: " + request.role());
        }

        target.setRole(newRole);
        groupMemberRepository.save(target);

        Group group = groupRepository.findById(groupId).orElseThrow();
        Chat chat = findGroupChat(groupId);
        return toResponse(group, chat.getId());
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroup(UUID groupId, UUID currentUserId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, currentUserId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this group"));

        Group group = groupRepository.findById(groupId).orElseThrow(() -> new NotFoundException("Group not found"));
        Chat chat = findGroupChat(groupId);
        return toResponse(group, chat.getId());
    }

    // ------------------------------------------------------------------
    private void requireAdminOrOwner(UUID groupId, UUID userId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this group"));
        if (member.getRole() != GroupRole.OWNER && member.getRole() != GroupRole.ADMIN) {
            throw new ForbiddenException("Only group owners or admins can do this");
        }
    }

    private void requireOwner(UUID groupId, UUID userId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this group"));
        if (member.getRole() != GroupRole.OWNER) {
            throw new ForbiddenException("Only the group owner can do this");
        }
    }

    private Chat findGroupChat(UUID groupId) {
        // A group has exactly one backing chat, created alongside it.
        return chatRepository.findByGroupId(groupId)
                .orElseThrow(() -> new NotFoundException("Chat for this group not found"));
    }

    private GroupResponse toResponse(Group group, UUID chatId) {
        List<GroupMemberResponse> members = groupMemberRepository.findByGroupId(group.getId()).stream()
                .map(gm -> new GroupMemberResponse(gm.getUser().getId(), gm.getUser().getDisplayName(), gm.getRole().name()))
                .toList();

        return new GroupResponse(group.getId(), group.getName(), group.getDescription(),
                group.getAvatarUrl(), chatId, members, group.getCreatedAt());
    }
}
