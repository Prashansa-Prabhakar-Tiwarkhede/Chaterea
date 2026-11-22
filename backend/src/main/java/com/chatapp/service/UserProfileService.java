package com.chatapp.service;

import com.chatapp.dto.user.ProfileResponse;
import com.chatapp.dto.user.UpdateProfileRequest;
import com.chatapp.entity.User;
import com.chatapp.exception.NotFoundException;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        return toResponse(userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found")));
    }

    @Transactional
    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));

        if (request.displayName() != null && !request.displayName().isBlank()) {
            user.setDisplayName(request.displayName());
        }
        if (request.bio() != null) {
            user.setBio(request.bio());
        }
        if (request.profilePictureUrl() != null) {
            user.setProfilePictureUrl(request.profilePictureUrl());
        }

        return toResponse(userRepository.save(user));
    }

    private ProfileResponse toResponse(User u) {
        return new ProfileResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.getBio(),
                u.getProfilePictureUrl(), u.getRole().name(), u.isOnline(), u.getLastSeenAt(), u.isEmailVerified());
    }
}
