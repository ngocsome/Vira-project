package vn.vira.notification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.vira.user.domain.User;

@Getter
@Setter
@Entity
@Table(name = "notifications")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 60)
    private String type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 1000)
    private String body;

    @Column(length = 500)
    private String targetUrl;

    private Instant readAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public Notification(User user, String type, String title, String body, String targetUrl) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.body = body;
        this.targetUrl = targetUrl;
        this.createdAt = Instant.now();
    }

    public void markRead() {
        this.readAt = Instant.now();
    }
}
