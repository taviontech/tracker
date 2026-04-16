package com.track.infrastructure.security;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRET_64_CHARS =
        "supersecretjwtkeyfrontrackerplatform2024changeinproduction!!!!";

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET_64_CHARS, 24);
    }

    // ── generateToken ─────────────────────────────────────────────────────────

    @Test
    void generateToken_returnsNonNullToken() {
        String userId = UUID.randomUUID().toString();
        String token = jwtService.generateToken(userId, "test@example.com");

        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    void generateToken_tokenHasThreeParts() {
        String token = jwtService.generateToken("user-id", "test@example.com");
        // JWT format: header.payload.signature
        assertThat(token.split("\\.")).hasSize(3);
    }

    // ── extractClaims ─────────────────────────────────────────────────────────

    @Test
    void extractClaims_subjectMatchesUserId() {
        String userId = UUID.randomUUID().toString();
        String token = jwtService.generateToken(userId, "test@example.com");

        Claims claims = jwtService.extractClaims(token);

        assertThat(claims.getSubject()).isEqualTo(userId);
    }

    @Test
    void extractClaims_emailClaimPresent() {
        String token = jwtService.generateToken("uid", "alice@example.com");

        Claims claims = jwtService.extractClaims(token);

        assertThat(claims.get("email", String.class)).isEqualTo("alice@example.com");
    }

    @Test
    void extractClaims_invalidToken_throwsException() {
        assertThatThrownBy(() -> jwtService.extractClaims("not.a.valid.token"))
            .isInstanceOf(Exception.class);
    }

    // ── isTokenValid ──────────────────────────────────────────────────────────

    @Test
    void isTokenValid_validToken_returnsTrue() {
        String token = jwtService.generateToken("uid", "test@example.com");

        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    void isTokenValid_invalidToken_returnsFalse() {
        assertThat(jwtService.isTokenValid("garbage_token")).isFalse();
    }

    @Test
    void isTokenValid_tamperedToken_returnsFalse() {
        String token = jwtService.generateToken("uid", "test@example.com");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        assertThat(jwtService.isTokenValid(tampered)).isFalse();
    }

    @Test
    void isTokenValid_emptyString_returnsFalse() {
        assertThat(jwtService.isTokenValid("")).isFalse();
    }

    @Test
    void isTokenValid_tokenFromDifferentSecret_returnsFalse() {
        JwtService otherService = new JwtService("completely_different_secret_key_for_testing_purposes!!", 24);
        String otherToken = otherService.generateToken("uid", "test@example.com");

        assertThat(jwtService.isTokenValid(otherToken)).isFalse();
    }

    // ── extractUserId ─────────────────────────────────────────────────────────

    @Test
    void extractUserId_returnsCorrectId() {
        String userId = UUID.randomUUID().toString();
        String token = jwtService.generateToken(userId, "test@example.com");

        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
    }

    // ── short secret padding ──────────────────────────────────────────────────

    @Test
    void constructor_shortSecret_padsAutomatically() {
        JwtService service = new JwtService("short", 1);
        String token = service.generateToken("uid", "test@example.com");

        assertThat(service.isTokenValid(token)).isTrue();
    }

    @Test
    void constructor_exactlyMinLength_worksCorrectly() {
        String exactKey = "a".repeat(64);
        JwtService service = new JwtService(exactKey, 24);
        String token = service.generateToken("uid", "test@example.com");

        assertThat(service.isTokenValid(token)).isTrue();
    }

    // ── expiry ────────────────────────────────────────────────────────────────

    @Test
    void generateToken_expirySetCorrectly() {
        JwtService service = new JwtService(SECRET_64_CHARS, 2);
        String token = service.generateToken("uid", "test@example.com");
        Claims claims = service.extractClaims(token);

        long expectedExpiry = System.currentTimeMillis() + 2L * 3600 * 1000;
        long actualExpiry = claims.getExpiration().getTime();

        // Allow 5 seconds tolerance
        assertThat(Math.abs(actualExpiry - expectedExpiry)).isLessThan(5000L);
    }
}
