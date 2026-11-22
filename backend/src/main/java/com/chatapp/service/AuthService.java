package com.chatapp.service;

import com.chatapp.config.JwtProperties;
import com.chatapp.config.SecurityProperties;
import com.chatapp.dto.auth.*;
import com.chatapp.entity.*;
import com.chatapp.enums.UserStatus;
import com.chatapp.exception.AccountLockedException;
import com.chatapp.exception.BadRequestException;
import com.chatapp.exception.ConflictException;
import com.chatapp.exception.UnauthorizedException;
import com.chatapp.repository.*;
import com.chatapp.security.JwtService;
import com.chatapp.util.TokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PublicKeyRepository publicKeyRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final AccountUnlockOtpRepository accountUnlockOtpRepository;

    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final MailService mailService;
    private final AuditLogService auditLogService;

    private final JwtProperties jwtProperties;
    private final SecurityProperties securityProperties;

    // ------------------------------------------------------------------
    // Register
    // ------------------------------------------------------------------
    @Transactional
    public MessageResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new ConflictException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .displayName(request.displayName())
                .role(com.chatapp.enums.Role.USER)
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .build();
        user = userRepository.save(user);

        PublicKey encryptionKey = PublicKey.builder()
                .user(user)
                .publicKeyPem(request.encryptionPublicKey())
                .keyAlgorithm(com.chatapp.util.CryptoAlgorithms.RSA_OAEP_2048)
                .active(true)
                .build();
        publicKeyRepository.save(encryptionKey);

        PublicKey signingKey = PublicKey.builder()
                .user(user)
                .publicKeyPem(request.signingPublicKey())
                .keyAlgorithm(com.chatapp.util.CryptoAlgorithms.RSASSA_PKCS1_2048)
                .active(true)
                .build();
        publicKeyRepository.save(signingKey);

        issueEmailVerificationToken(user);

        auditLogService.log(user, "REGISTER", "User", user.getId(), httpRequest, Map.of());

        return new MessageResponse("Registration successful. Please check your email to verify your account.");
    }

    private void issueEmailVerificationToken(User user) {
        String rawToken = TokenUtil.generateOpaqueToken();
        EmailVerificationToken evt = EmailVerificationToken.builder()
                .user(user)
                .tokenHash(TokenUtil.sha256(rawToken))
                .expiresAt(Instant.now().plus(securityProperties.getEmailVerificationTokenExpirationHours(), ChronoUnit.HOURS))
                .build();
        emailVerificationTokenRepository.save(evt);
        mailService.sendEmailVerification(user.getEmail(), rawToken);
    }

    // ------------------------------------------------------------------
    // Email verification
    // ------------------------------------------------------------------
    @Transactional
    public MessageResponse verifyEmail(VerifyEmailRequest request) {
        String hash = TokenUtil.sha256(request.token());
        EmailVerificationToken evt = emailVerificationTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification token"));

        if (evt.isUsed() || evt.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invalid or expired verification token");
        }

        User user = evt.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        evt.setUsed(true);
        emailVerificationTokenRepository.save(evt);

        return new MessageResponse("Email verified successfully. You can now log in.");
    }

    // ------------------------------------------------------------------
    // Login
    // ------------------------------------------------------------------
    @Transactional(noRollbackFor = UnauthorizedException.class)
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (user.isAccountLocked()) {
            throw new AccountLockedException("Account is locked due to too many failed login attempts. Check your email to unlock it.");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new UnauthorizedException("This account has been banned");
        }

        boolean matches = passwordEncoder.matches(request.password(), user.getPasswordHash());

        if (!matches) {
            handleFailedLogin(user, httpRequest);
            throw new UnauthorizedException("Invalid email or password");
        }

        // Successful login resets the failed-attempt counter.
        user.setFailedLoginAttempts((short) 0);
        user.setOnline(true);
        user.setLastSeenAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshTokenService.issue(user, AuditLogService.extractClientIp(httpRequest));

        auditLogService.log(user, "LOGIN_SUCCESS", "User", user.getId(), httpRequest, Map.of());

        return toAuthResponse(user, accessToken, refreshToken);
    }

    private void handleFailedLogin(User user, HttpServletRequest httpRequest) {
        short attempts = (short) (user.getFailedLoginAttempts() + 1);
        user.setFailedLoginAttempts(attempts);

        auditLogService.log(user, "LOGIN_FAILURE", "User", user.getId(), httpRequest,
                Map.of("attempt", attempts));

        if (attempts >= securityProperties.getMaxFailedLoginAttempts()) {
            user.setAccountLocked(true);
            user.setAccountLockedAt(Instant.now());
            issueAccountUnlockOtp(user);
            auditLogService.log(user, "ACCOUNT_LOCKED", "User", user.getId(), httpRequest, Map.of());
        }

        userRepository.save(user);
    }

    private void issueAccountUnlockOtp(User user) {
        String otp = TokenUtil.generateOtp();
        AccountUnlockOtp entity = AccountUnlockOtp.builder()
                .user(user)
                .otpHash(TokenUtil.sha256(otp))
                .expiresAt(Instant.now().plus(securityProperties.getAccountLockOtpExpirationMinutes(), ChronoUnit.MINUTES))
                .build();
        accountUnlockOtpRepository.save(entity);
        mailService.sendAccountUnlockOtp(user.getEmail(), otp);
    }

    // ------------------------------------------------------------------
    // Unlock account via OTP
    // ------------------------------------------------------------------
    @Transactional
    public MessageResponse unlockAccount(UnlockAccountRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid email or code"));

        var otps = accountUnlockOtpRepository.findByUserIdAndUsedFalseOrderByCreatedAtDesc(user.getId());
        String hash = TokenUtil.sha256(request.otp());

        AccountUnlockOtp match = otps.stream()
                .filter(o -> o.getOtpHash().equals(hash) && o.getExpiresAt().isAfter(Instant.now()))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Invalid or expired unlock code"));

        match.setUsed(true);
        accountUnlockOtpRepository.save(match);

        user.setAccountLocked(false);
        user.setAccountLockedAt(null);
        user.setFailedLoginAttempts((short) 0);
        userRepository.save(user);

        auditLogService.log(user, "ACCOUNT_UNLOCKED", "User", user.getId(), httpRequest, Map.of());

        return new MessageResponse("Account unlocked. You can now log in.");
    }

    // ------------------------------------------------------------------
    // Refresh
    // ------------------------------------------------------------------
    @Transactional
    public AuthResponse refresh(RefreshRequest request, HttpServletRequest httpRequest) {
        RefreshTokenService.RotationResult result =
                refreshTokenService.rotate(request.refreshToken(), AuditLogService.extractClientIp(httpRequest));

        User user = result.user();
        String newAccessToken = jwtService.generateAccessToken(user);

        return toAuthResponse(user, newAccessToken, result.newRawToken());
    }

    // ------------------------------------------------------------------
    // Logout
    // ------------------------------------------------------------------
    @Transactional
    public MessageResponse logout(LogoutRequest request, User currentUser, HttpServletRequest httpRequest) {
        refreshTokenService.revoke(request.refreshToken());

        currentUser.setOnline(false);
        currentUser.setLastSeenAt(Instant.now());
        userRepository.save(currentUser);

        auditLogService.log(currentUser, "LOGOUT", "User", currentUser.getId(), httpRequest, Map.of());

        return new MessageResponse("Logged out successfully");
    }

    // ------------------------------------------------------------------
    // Forgot / reset password
    // ------------------------------------------------------------------
    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        // Always return the same message whether or not the account exists,
        // to avoid leaking which emails are registered.
        userRepository.findByEmail(request.email().toLowerCase()).ifPresent(user -> {
            String rawToken = TokenUtil.generateOpaqueToken();
            PasswordResetToken token = PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(TokenUtil.sha256(rawToken))
                    .expiresAt(Instant.now().plus(securityProperties.getPasswordResetTokenExpirationMinutes(), ChronoUnit.MINUTES))
                    .build();
            passwordResetTokenRepository.save(token);
            mailService.sendPasswordReset(user.getEmail(), rawToken);
        });

        return new MessageResponse("If an account with that email exists, a password reset link has been sent.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request, HttpServletRequest httpRequest) {
        String hash = TokenUtil.sha256(request.token());
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invalid or expired reset token");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setFailedLoginAttempts((short) 0);
        user.setAccountLocked(false);
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        // Password change invalidates all existing sessions.
        refreshTokenService.revokeAllForUser(user);

        auditLogService.log(user, "PASSWORD_RESET", "User", user.getId(), httpRequest, Map.of());

        return new MessageResponse("Password has been reset. Please log in with your new password.");
    }

    // ------------------------------------------------------------------
    private AuthResponse toAuthResponse(User user, String accessToken, String refreshToken) {
        return new AuthResponse(
                accessToken,
                refreshToken,
                jwtProperties.getAccessTokenExpirationMs() / 1000,
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name()
        );
    }
}