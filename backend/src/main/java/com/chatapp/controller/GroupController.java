package com.chatapp.controller;

import com.chatapp.dto.group.*;
import com.chatapp.security.CustomUserDetails;
import com.chatapp.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<GroupResponse> create(@Valid @RequestBody CreateGroupRequest request,
                                                 @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(groupService.createGroup(principal.getId(), request));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> get(@PathVariable UUID groupId,
                                              @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(groupService.getGroup(groupId, principal.getId()));
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<GroupResponse> addMember(@PathVariable UUID groupId,
                                                    @Valid @RequestBody AddGroupMemberRequest request,
                                                    @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(groupService.addMember(groupId, principal.getId(), request));
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID groupId, @PathVariable UUID userId,
                                              @AuthenticationPrincipal CustomUserDetails principal) {
        groupService.removeMember(groupId, principal.getId(), userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{groupId}/members/{userId}/role")
    public ResponseEntity<GroupResponse> updateRole(@PathVariable UUID groupId, @PathVariable UUID userId,
                                                      @Valid @RequestBody UpdateGroupMemberRoleRequest request,
                                                      @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(groupService.updateMemberRole(groupId, principal.getId(), userId, request));
    }
}
