package com.chatapp.service;

import com.chatapp.config.JwtProperties;
import com.chatapp.entity.RefreshToken;
import com.chatapp.entity.User;
import com.chatapp.exception.UnauthorizedException;
import com.chatapp.repository.RefreshTokenRepository;
import com.chatapp.util.TokenUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Refresh tokens are opaque random strings, NOT JWTs — they are persisted
 * (hashed) so they can be individually revoked (logout, rotation-on-reuse
 * detection, admin ban) without waiting for expiry.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    @Transactional
    public String issue(User user, String clientIp) {
        String rawToken = TokenUtil.generateOpaqueToken();
        RefreshToken entity = RefreshToken.builder()
                .user(user)
                .tokenHash(TokenUtil.sha256(rawToken))
                .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshTokenExpirationMs()))
                .createdByIp(clientIp)
                .build();
        refreshTokenRepository.save(entity);
        return rawToken;
    }

    /**
     * Validates the presented raw refresh token, revokes it, and issues a new
     * one (rotation). If a token that was already revoked/replaced is
     * presented again, treat it as a reuse/theft signal and revoke the whole
     * chain for that user.
     */
    @Transactional
    public RotationResult rotate(String rawToken, String clientIp) {
        String hash = TokenUtil.sha256(rawToken);
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (existing.isRevoked()) {
            // Possible token theft/replay — nuke every active session for this user.
            refreshTokenRepository.revokeAllForUser(existing.getUser().getId(), Instant.now());
            throw new UnauthorizedException("Refresh token reuse detected. All sessions have been revoked.");
        }

        if (existing.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Refresh token has expired");
        }

        String newRawToken = TokenUtil.generateOpaqueToken();
        String newHash = TokenUtil.sha256(newRawToken);

        existing.setRevoked(true);
        existing.setRevokedAt(Instant.now());
        existing.setReplacedByTokenHash(newHash);
        refreshTokenRepository.save(existing);

        RefreshToken next = RefreshToken.builder()
                .user(existing.getUser())
                .tokenHash(newHash)
                .expiresAt(Instant.now().plusMillis(jwtProperties.getRefreshTokenExpirationMs()))
                .createdByIp(clientIp)
                .build();
        refreshTokenRepository.save(next);

        return new RotationResult(existing.getUser(), newRawToken);
    }

    @Transactional
    public void revoke(String rawToken) {
        String hash = TokenUtil.sha256(rawToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(rt -> {
            rt.setRevoked(true);
            rt.setRevokedAt(Instant.now());
            refreshTokenRepository.save(rt);
        });
    }

    @Transactional
    public void revokeAllForUser(User user) {
        refreshTokenRepository.revokeAllForUser(user.getId(), Instant.now());
    }

    public record RotationResult(User user, String newRawToken) {}
}
