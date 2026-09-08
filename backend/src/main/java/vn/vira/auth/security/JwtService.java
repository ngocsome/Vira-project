package vn.vira.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;
import vn.vira.user.domain.User;

@Service
public class JwtService {

    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
    }

    public String createAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(properties.getAccessTokenMinutes() * 60);

        return Jwts.builder()
                .issuer(properties.getIssuer())
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey())
                .compact();
    }

    public Long extractUserId(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey())
                .requireIssuer(properties.getIssuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Long.valueOf(claims.getSubject());
    }

    public long accessTokenSeconds() {
        return properties.getAccessTokenMinutes() * 60;
    }

    private SecretKey signingKey() {
        byte[] secret = properties.getSecret().getBytes(StandardCharsets.UTF_8);

        if (secret.length < 32) {
            throw new IllegalStateException("JWT secret phải có ít nhất 32 byte");
        }

        return Keys.hmacShaKeyFor(secret);
    }
}
