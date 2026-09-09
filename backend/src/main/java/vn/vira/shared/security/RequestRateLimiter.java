package vn.vira.shared.security;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import vn.vira.shared.exception.RateLimitExceededException;

@Service
public class RequestRateLimiter {

    private final ConcurrentHashMap<String, Deque<Instant>> windows = new ConcurrentHashMap<>();

    public void check(String scope, String subject, int maxRequests, Duration window) {
        String key = scope + ":" + subject;
        Instant now = Instant.now();
        Deque<Instant> attempts = windows.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (attempts) {
            Instant cutoff = now.minus(window);
            while (!attempts.isEmpty() && attempts.peekFirst().isBefore(cutoff)) {
                attempts.removeFirst();
            }
            if (attempts.size() >= maxRequests) {
                throw new RateLimitExceededException();
            }
            attempts.addLast(now);
        }
    }
}
