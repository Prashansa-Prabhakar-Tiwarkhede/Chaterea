package com.chatapp.service;

import com.chatapp.config.MailProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    @Async
    public void sendEmailVerification(String toEmail, String token) {
        String link = "https://your-frontend.example.com/verify-email?token=" + token;
        send(toEmail, "Verify your email",
                "Welcome! Please verify your email by visiting:\n" + link +
                "\n\nThis link expires soon. If you didn't sign up, ignore this email.");
    }

    @Async
    public void sendPasswordReset(String toEmail, String token) {
        String link = "https://your-frontend.example.com/reset-password?token=" + token;
        send(toEmail, "Reset your password",
                "We received a request to reset your password. Visit:\n" + link +
                "\n\nIf you didn't request this, you can safely ignore this email.");
    }

    @Async
    public void sendAccountUnlockOtp(String toEmail, String otp) {
        send(toEmail, "Your account unlock code",
                "Your account was locked after multiple failed login attempts.\n" +
                "Your one-time unlock code is: " + otp +
                "\n\nThis code expires shortly. If this wasn't you, consider changing your password once unlocked.");
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailProperties.getFrom());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            // Never let a mail-provider outage break the auth flow itself.
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
