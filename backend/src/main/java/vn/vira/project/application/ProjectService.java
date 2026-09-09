package vn.vira.project.application;

import java.util.List;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.project.api.CreateProjectRequest;
import vn.vira.project.api.ProjectResponse;
import vn.vira.project.api.UpdateProjectRequest;
import vn.vira.board.application.BoardService;
import vn.vira.project.domain.Project;
import vn.vira.project.domain.ProjectMember;
import vn.vira.project.domain.ProjectMemberRepository;
import vn.vira.project.domain.ProjectRepository;
import vn.vira.project.domain.ProjectRole;
import vn.vira.shared.exception.BusinessException;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;
import vn.vira.workspace.application.WorkspaceService;
import vn.vira.workspace.domain.Workspace;
import vn.vira.audit.application.ActivityLogService;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final WorkspaceService workspaceService;
    private final CurrentUser currentUser;
    private final ProjectMapper projectMapper;
    private final BoardService boardService;
    private final ActivityLogService activityLogs;

    @Transactional
    public ProjectResponse create(Long workspaceId, CreateProjectRequest request) {
        Workspace workspace = workspaceService.requireMember(workspaceId);
        Long userId = currentUser.id();
        String projectKey = request.projectKey().trim().toUpperCase();

        if (request.targetEndDate() != null && request.startDate() != null
                && request.targetEndDate().isBefore(request.startDate())) {
            throw new BusinessException("Ngày kết thúc dự kiến không được sớm hơn ngày bắt đầu");
        }

        if (projectRepository.existsByWorkspaceIdAndProjectKeyIgnoreCase(workspaceId, projectKey)) {
            throw new BusinessException("Mã dự án đã tồn tại trong không gian làm việc này");
        }

        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));

        Project project = projectRepository.save(new Project(
                workspace,
                owner,
                request.name().trim(),
                projectKey,
                normalize(request.description()),
                request.projectType(),
                request.startDate(),
                request.targetEndDate()
        ));

        projectMemberRepository.save(new ProjectMember(project, owner, ProjectRole.OWNER));
        boardService.createDefaultBoard(project);
        activityLogs.recordProject(project, "PROJECT_CREATED", "Tạo dự án");
        return projectMapper.toResponse(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> findByWorkspace(Long workspaceId) {
        workspaceService.requireMember(workspaceId);

        return projectRepository.findByWorkspaceIdAndArchivedAtIsNullOrderByUpdatedAtDesc(workspaceId)
                .stream()
                .map(projectMapper::toResponse)
                .toList();
    }
    @Transactional(readOnly = true)
    public List<ProjectResponse> findArchivedByWorkspace(Long workspaceId) { workspaceService.requireMember(workspaceId); return projectRepository.findByWorkspaceIdAndArchivedAtIsNotNullOrderByUpdatedAtDesc(workspaceId).stream().map(projectMapper::toResponse).toList(); }

    @Transactional(readOnly = true)
    public ProjectResponse findOne(Long projectId) {
        return projectMapper.toResponse(requireMember(projectId));
    }

    @Transactional
    public ProjectResponse update(Long projectId, UpdateProjectRequest request) {
        Project project = requireOwner(projectId);
        if (request.startDate() != null && request.targetEndDate() != null && request.targetEndDate().isBefore(request.startDate())) {
            throw new BusinessException("Ngày kết thúc dự kiến không được sớm hơn ngày bắt đầu");
        }
        project.setName(request.name().trim());
        project.setDescription(normalize(request.description()));
        project.setProjectType(request.projectType());
        project.setStatus(request.status());
        project.setStartDate(request.startDate());
        project.setTargetEndDate(request.targetEndDate());
        activityLogs.recordProject(project, "PROJECT_UPDATED", "Cập nhật cấu hình dự án");
        return projectMapper.toResponse(project);
    }

    @Transactional
    public ProjectResponse archive(Long projectId) {
        Project project = requireOwner(projectId);
        project.setArchivedAt(Instant.now());
        activityLogs.recordProject(project, "PROJECT_ARCHIVED", "Lưu trữ dự án");
        return projectMapper.toResponse(project);
    }
    @Transactional
    public ProjectResponse restore(Long projectId) {
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new NotFoundException("Không tìm thấy dự án"));
        workspaceService.requireMember(project.getWorkspace().getId());
        if (!project.getOwner().getId().equals(currentUser.id())) throw new org.springframework.security.access.AccessDeniedException("Chỉ chủ sở hữu mới có thể khôi phục dự án");
        project.setArchivedAt(null);
        activityLogs.recordProject(project, "PROJECT_RESTORED", "Khôi phục dự án");
        return projectMapper.toResponse(project);
    }

    @Transactional(readOnly = true)
    public Project requireMember(Long projectId) {
        Long userId = currentUser.id();

        if (!projectMemberRepository.existsByProjectIdAndUserIdAndRemovedAtIsNull(projectId, userId)) {
            throw new NotFoundException("Không tìm thấy dự án");
        }

        return projectRepository.findByIdAndArchivedAtIsNull(projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy dự án"));
    }

    @Transactional(readOnly = true)
    public Project requireManager(Long projectId) {
        Project project = requireMember(projectId);
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserIdAndRemovedAtIsNull(projectId, currentUser.id())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thành viên dự án"));
        if (member.getRole() != ProjectRole.OWNER && member.getRole() != ProjectRole.MANAGER && member.getRole() != ProjectRole.LEAD) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền cấu hình dự án");
        }
        return project;
    }

    private Project requireOwner(Long projectId) {
        Project project = requireMember(projectId);
        if (!project.getOwner().getId().equals(currentUser.id())) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ chủ sở hữu mới có thể cấu hình dự án");
        }
        return project;
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
