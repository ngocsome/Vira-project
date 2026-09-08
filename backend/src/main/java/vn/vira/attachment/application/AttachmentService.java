package vn.vira.attachment.application;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.vira.attachment.api.AttachmentResponse;
import vn.vira.attachment.domain.TaskAttachment;
import vn.vira.attachment.domain.TaskAttachmentRepository;
import vn.vira.project.application.ProjectService;
import vn.vira.shared.exception.BusinessException;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.task.domain.Task;
import vn.vira.task.domain.TaskRepository;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private final TaskAttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectService projectService;
    private final CurrentUser currentUser;
    private final Path storagePath = Path.of("uploads").toAbsolutePath().normalize();

    @Transactional(readOnly = true)
    public List<AttachmentResponse> findAll(Long projectId, Long taskId) {
        projectService.requireMember(projectId);
        requireTask(projectId, taskId);
        return attachmentRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AttachmentResponse upload(Long projectId, Long taskId, MultipartFile file) {
        projectService.requireMember(projectId);
        Task task = requireTask(projectId, taskId);
        validate(file);
        User uploader = userRepository.findById(currentUser.id()).orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        String storedName = UUID.randomUUID() + extension(file.getOriginalFilename());
        try {
            Files.createDirectories(storagePath);
            try (var input = file.getInputStream()) {
                Files.copy(input, storagePath.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new BusinessException("Không thể lưu tệp đính kèm");
        }
        return toResponse(attachmentRepository.save(new TaskAttachment(task, uploader, safeName(file.getOriginalFilename()), storedName, file.getContentType(), file.getSize())));
    }

    @Transactional(readOnly = true)
    public DownloadedAttachment download(Long projectId, Long taskId, Long attachmentId) {
        projectService.requireMember(projectId);
        TaskAttachment attachment = attachmentRepository.findByIdAndTaskId(attachmentId, taskId).orElseThrow(() -> new NotFoundException("Không tìm thấy tệp đính kèm"));
        try {
            Resource resource = new UrlResource(storagePath.resolve(attachment.getStoredName()).toUri());
            if (!resource.exists()) throw new NotFoundException("Tệp đính kèm không còn tồn tại");
            return new DownloadedAttachment(resource, attachment.getOriginalName(), attachment.getContentType());
        } catch (java.net.MalformedURLException exception) {
            throw new NotFoundException("Không tìm thấy tệp đính kèm");
        }
    }

    private Task requireTask(Long projectId, Long taskId) { return taskRepository.findByIdAndProjectIdAndDeletedAtIsNull(taskId, projectId).orElseThrow(() -> new NotFoundException("Không tìm thấy công việc")); }
    private void validate(MultipartFile file) { if (file == null || file.isEmpty()) throw new BusinessException("Vui lòng chọn tệp để tải lên"); if (file.getSize() > MAX_FILE_SIZE) throw new BusinessException("Tệp đính kèm không được vượt quá 10 MB"); }
    private String safeName(String value) { return value == null ? "attachment" : Path.of(value).getFileName().toString(); }
    private String extension(String value) { String name = safeName(value); int dot = name.lastIndexOf('.'); return dot >= 0 ? name.substring(dot) : ""; }
    private AttachmentResponse toResponse(TaskAttachment attachment) { return new AttachmentResponse(attachment.getId(), attachment.getOriginalName(), attachment.getContentType(), attachment.getFileSize(), attachment.getUploader().getFullName(), attachment.getCreatedAt()); }
    public record DownloadedAttachment(Resource resource, String originalName, String contentType) { }
}
