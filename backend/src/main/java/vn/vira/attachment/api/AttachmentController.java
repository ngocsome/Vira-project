package vn.vira.attachment.api;

import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import vn.vira.attachment.application.AttachmentService;
import vn.vira.shared.api.ApiResponse;
import vn.vira.shared.security.CurrentUser;
import vn.vira.shared.security.RequestRateLimiter;

@RestController
@RequestMapping("/projects/{projectId}/tasks/{taskId}/attachments")
@RequiredArgsConstructor
public class AttachmentController {
    private final AttachmentService attachmentService;
    private final RequestRateLimiter rateLimiter;
    private final CurrentUser currentUser;
    @GetMapping public ApiResponse<List<AttachmentResponse>> findAll(@PathVariable Long projectId, @PathVariable Long taskId) { return ApiResponse.ok(attachmentService.findAll(projectId, taskId), "Lấy tệp đính kèm thành công"); }
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE) public ApiResponse<AttachmentResponse> upload(@PathVariable Long projectId, @PathVariable Long taskId, @RequestPart("file") MultipartFile file, HttpServletRequest request) {
        rateLimiter.check("upload", currentUser.id() + ":" + request.getRemoteAddr(), 20, Duration.ofMinutes(1));
        return ApiResponse.ok(attachmentService.upload(projectId, taskId, file), "Tải tệp lên thành công");
    }
    @GetMapping("/{attachmentId}/download") public ResponseEntity<Resource> download(@PathVariable Long projectId, @PathVariable Long taskId, @PathVariable Long attachmentId) { var item = attachmentService.download(projectId, taskId, attachmentId); return ResponseEntity.ok().contentType(item.contentType() == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(item.contentType())).header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(item.originalName()).build().toString()).body(item.resource()); }
}
