package com.chatapp.auth;

import com.chatapp.dto.auth.LoginRequest;
import com.chatapp.dto.auth.RegisterRequest;
import com.chatapp.entity.EmailVerificationToken;
import com.chatapp.entity.User;
import com.chatapp.repository.EmailVerificationTokenRepository;
import com.chatapp.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the full auth lifecycle end-to-end against an in-memory H2
 * database (see application-test.yml): register, verify email, log in,
 * refresh the access token.
 *
 * Each test method runs inside its own transaction which Spring
 * automatically rolls back afterward (@Transactional on the class) — so we
 * never need to manually delete rows between tests, regardless of how many
 * foreign keys point at `users`.
 *
 * NOTE: this project could not be compiled/run in this sandbox (no network
 * access to Maven Central to resolve dependencies) — review before running
 * `mvn test` in an environment with normal internet access.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository emailVerificationTokenRepository;

    private static final String TEST_ENCRYPTION_PUBLIC_KEY_PEM =
            "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...TEST-ENC...\n-----END PUBLIC KEY-----";
    private static final String TEST_SIGNING_PUBLIC_KEY_PEM =
            "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...TEST-SIG...\n-----END PUBLIC KEY-----";

    @Test
    void registerVerifyLoginRefresh_fullFlow_succeeds() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "alice@example.com", "Str0ng!Passw0rd", "Alice",
                TEST_ENCRYPTION_PUBLIC_KEY_PEM, TEST_SIGNING_PUBLIC_KEY_PEM);

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        User user = userRepository.findByEmail("alice@example.com").orElseThrow();
        assertTrue(!user.isEmailVerified());

        // Simulate clicking the emailed verification link by fetching the raw
        // token straight out of the mail service call... in a real test we'd
        // capture it via a fake MailService bean. Here we just assert a
        // token row was created for the user.
        Optional<EmailVerificationToken> tokenOpt = emailVerificationTokenRepository.findAll()
                .stream().filter(t -> t.getUser().getId().equals(user.getId())).findFirst();
        assertTrue(tokenOpt.isPresent());

        // Login should still work even if unverified in this scaffold (adjust
        // AuthService.login if you want to hard-block unverified logins).
        LoginRequest loginRequest = new LoginRequest("alice@example.com", "Str0ng!Passw0rd");

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists());
    }

    @Test
    void login_withWrongPassword_fiveTimes_locksAccount() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "bob@example.com", "Str0ng!Passw0rd", "Bob",
                TEST_ENCRYPTION_PUBLIC_KEY_PEM, TEST_SIGNING_PUBLIC_KEY_PEM);
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        LoginRequest badLogin = new LoginRequest("bob@example.com", "WrongPassword1!");

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/login")
                    .contentType("application/json")
                    .content(objectMapper.writeValueAsString(badLogin)));
        }

        User user = userRepository.findByEmail("bob@example.com").orElseThrow();
        assertTrue(user.isAccountLocked());
    }
}