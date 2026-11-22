package com.chatapp.controller;

import com.chatapp.dto.user.PublicKeysResponse;
import com.chatapp.service.PublicKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class PublicKeyController {

    private final PublicKeyService publicKeyService;

    @GetMapping("/{userId}/public-keys")
    public ResponseEntity<PublicKeysResponse> getPublicKeys(@PathVariable UUID userId) {
        return ResponseEntity.ok(publicKeyService.getPublicKeys(userId));
    }
}
