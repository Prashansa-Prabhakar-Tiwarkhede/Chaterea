package com.chatapp.service;

import com.chatapp.dto.user.PublicKeysResponse;
import com.chatapp.entity.PublicKey;
import com.chatapp.exception.NotFoundException;
import com.chatapp.repository.PublicKeyRepository;
import com.chatapp.util.CryptoAlgorithms;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublicKeyService {

    private final PublicKeyRepository publicKeyRepository;

    public PublicKeysResponse getPublicKeys(UUID userId) {
        String encryptionKey = publicKeyRepository
                .findByUserIdAndKeyAlgorithmAndActiveTrue(userId, CryptoAlgorithms.RSA_OAEP_2048)
                .map(PublicKey::getPublicKeyPem)
                .orElseThrow(() -> new NotFoundException("No active encryption key for this user"));

        String signingKey = publicKeyRepository
                .findByUserIdAndKeyAlgorithmAndActiveTrue(userId, CryptoAlgorithms.RSASSA_PKCS1_2048)
                .map(PublicKey::getPublicKeyPem)
                .orElseThrow(() -> new NotFoundException("No active signing key for this user"));

        return new PublicKeysResponse(userId, encryptionKey, signingKey);
    }
}
