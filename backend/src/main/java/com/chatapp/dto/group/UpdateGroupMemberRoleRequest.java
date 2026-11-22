package com.chatapp.dto.group;

import jakarta.validation.constraints.NotNull;

public record UpdateGroupMemberRoleRequest(
        @NotNull String role // OWNER, ADMIN, MEMBER
) {}
