package com.chatapp.dto.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateGroupRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 500) String description,
        @NotEmpty List<UUID> memberIds
) {}
