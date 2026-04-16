package com.track.infrastructure.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Service
public class JwtService {

    private static final int MIN_HS512_KEY_BYTES = 64;
    private static final int SECONDS_PER_HOUR    = 3600;
    private static final int MILLIS_PER_SECOND   = 1000;

    private final SecretKey key;
    private final long expiryMillis;

    public JwtService(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiry-hours:24}") int expiryHours
    ) {
        byte[] keyBytes;
        if (secret.length() >= MIN_HS512_KEY_BYTES) {
            keyBytes = secret.getBytes();
        } else {
            String padded = secret.repeat((MIN_HS512_KEY_BYTES / secret.length()) + 1);
            keyBytes = padded.substring(0, MIN_HS512_KEY_BYTES).getBytes();
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.expiryMillis = (long) expiryHours * SECONDS_PER_HOUR * MILLIS_PER_SECOND;
    }

    public String generateToken(String userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiryMillis);
        return Jwts.builder()
            .subject(userId)
            .claim("email", email)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(key)
            .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean isTokenValid(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    public String extractUserId(String token) {
        return extractClaims(token).getSubject();
    }
}
