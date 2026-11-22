package com.chatapp.repository;

import com.chatapp.entity.AccountUnlockOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AccountUnlockOtpRepository extends JpaRepository<AccountUnlockOtp, UUID> {
    List<AccountUnlockOtp> findByUserIdAndUsedFalseOrderByCreatedAtDesc(UUID userId);
}
