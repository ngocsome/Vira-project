package vn.vira.shared.security;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vn.vira.shared.exception.RateLimitExceededException;

@Service
public class RequestRateLimiter {

    private final ConcurrentHashMap<String, Deque<Instant>> windows = new ConcurrentHashMap<>();
    private final ObjectProvider<StringRedisTemplate> redisTemplateProvider;

    public RequestRateLimiter(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.redisTemplateProvider = redisTemplateProvider;
    }

    /** Constructor dedicated to deterministic unit tests without a Redis runtime. */
    RequestRateLimiter() {
        this.redisTemplateProvider = null;
    }

    public void check(String scope, String subject, int maxRequests, Duration window) {
        StringRedisTemplate redis = redisTemplateProvider == null ? null : redisTemplateProvider.getIfAvailable();
        if (redis != null) {
            checkRedis(redis, scope, subject, maxRequests, window);
            return;
        }
        checkInMemory(scope, subject, maxRequests, window);
    }

    private void checkRedis(StringRedisTemplate redis, String scope, String subject, int maxRequests, Duration window) {
        String safeSubject = Base64.getUrlEncoder().withoutPadding().encodeToString(subject.getBytes(StandardCharsets.UTF_8));
        String key = "vira:rate-limit:" + scope + ":" + safeSubject;
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1) redis.expire(key, window);
            if (count != null && count > maxRequests) throw new RateLimitExceededException();
        } catch (DataAccessException exception) {
            throw new RateLimitExceededException();
        }
    }

    private void checkInMemory(String scope, String subject, int maxRequests, Duration window) {
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
