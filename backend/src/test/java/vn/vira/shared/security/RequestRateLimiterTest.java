package vn.vira.shared.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import vn.vira.shared.exception.RateLimitExceededException;

class RequestRateLimiterTest {
    @Test
    void rejectsRequestAboveConfiguredLimit() {
        RequestRateLimiter limiter = new RequestRateLimiter();
        assertDoesNotThrow(() -> limiter.check("login", "192.0.2.1", 2, Duration.ofMinutes(1)));
        assertDoesNotThrow(() -> limiter.check("login", "192.0.2.1", 2, Duration.ofMinutes(1)));
        assertThrows(RateLimitExceededException.class, () -> limiter.check("login", "192.0.2.1", 2, Duration.ofMinutes(1)));
    }
}
