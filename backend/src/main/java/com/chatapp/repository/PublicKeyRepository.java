package com.chatapp.repository;

import com.chatapp.entity.PublicKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PublicKeyRepository extends JpaRepository<PublicKey, UUID> {
    Optional<PublicKey> findByUserIdAndActiveTrue(UUID userId);
    Optional<PublicKey> findByUserIdAndKeyAlgorithmAndActiveTrue(UUID userId, String keyAlgorithm);
}
