package vn.vira.audit.api;
import java.time.Instant;
public record ActivityLogResponse(Long id, Long taskId, String taskCode, Long actorId, String actorName, String action, String details, Instant createdAt) { }
