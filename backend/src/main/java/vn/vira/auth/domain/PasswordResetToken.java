package vn.vira.auth.domain;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import vn.vira.user.domain.User;

@Getter @Entity @Table(name = "password_reset_tokens") @NoArgsConstructor
public class PasswordResetToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @Column(name = "token_hash", nullable = false, length = 64) private String tokenHash;
    private Instant expiresAt;
    private Instant usedAt;
    private Instant createdAt;
    public PasswordResetToken(User user, String tokenHash, Instant expiresAt) { this.user=user; this.tokenHash=tokenHash; this.expiresAt=expiresAt; this.createdAt=Instant.now(); }
    public boolean isUsable(Instant now) { return usedAt == null && expiresAt.isAfter(now); }
    public void use() { usedAt = Instant.now(); }
}
