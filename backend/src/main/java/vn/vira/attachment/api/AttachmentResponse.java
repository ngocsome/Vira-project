package vn.vira.attachment.api;

import java.time.Instant;

public record AttachmentResponse(Long id, String originalName, String contentType, long fileSize, String uploaderName, Instant createdAt) {
}
