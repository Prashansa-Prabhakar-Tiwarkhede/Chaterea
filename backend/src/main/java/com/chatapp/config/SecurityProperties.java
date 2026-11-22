package com.chatapp.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.security")
@Getter
@Setter
public class SecurityProperties {
    private int maxFailedLoginAttempts;
    private int accountLockOtpExpirationMinutes;
    private int passwordResetTokenExpirationMinutes;
    private int emailVerificationTokenExpirationHours;
}
