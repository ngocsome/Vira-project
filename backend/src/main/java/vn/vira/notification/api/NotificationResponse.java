package vn.vira.notification.api;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        String title,
        String body,
        String targetUrl,
        Instant readAt,
        Instant createdAt
) {
}
