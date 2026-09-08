package vn.vira.project.application;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.project.api.AddProjectMemberRequest;
import vn.vira.project.api.ProjectMemberResponse;
import vn.vira.project.api.UpdateProjectMemberRoleRequest;
import vn.vira.project.domain.Project;
import vn.vira.project.domain.ProjectMember;
import vn.vira.project.domain.ProjectMemberRepository;
import vn.vira.project.domain.ProjectRole;
import vn.vira.shared.exception.BusinessException;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;

@Service
@RequiredArgsConstructor
public class ProjectMemberService {

    private final ProjectService projectService;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> findAll(Long projectId) {
        projectService.requireMember(projectId);

        return projectMemberRepository.findByProjectIdAndRemovedAtIsNullOrderByJoinedAtAsc(projectId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProjectMemberResponse add(Long projectId, AddProjectMemberRequest request) {
        Project project = requireManager(projectId);
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng cần mời"));

        if (projectMemberRepository.existsByProjectIdAndUserIdAndRemovedAtIsNull(projectId, user.getId())) {
            throw new BusinessException("Người dùng đã là thành viên của dự án");
        }

        ProjectMember member = projectMemberRepository.save(new ProjectMember(project, user, request.role()));
        return toResponse(member);
    }

    @Transactional
    public ProjectMemberResponse updateRole(
            Long projectId,
            Long userId,
            UpdateProjectMemberRoleRequest request
    ) {
        requireManager(projectId);
        ProjectMember member = findMember(projectId, userId);

        if (member.getRole() == ProjectRole.OWNER) {
            throw new BusinessException("Không thể thay đổi vai trò chủ sở hữu dự án");
        }

        member.changeRole(request.role());
        return toResponse(member);
    }

    @Transactional
    public void remove(Long projectId, Long userId) {
        requireManager(projectId);
        ProjectMember member = findMember(projectId, userId);

        if (member.getRole() == ProjectRole.OWNER) {
            throw new BusinessException("Không thể xóa chủ sở hữu dự án");
        }

        member.remove();
    }

    private Project requireManager(Long projectId) {
        Project project = projectService.requireMember(projectId);
        ProjectMember currentMember = findMember(projectId, currentUser.id());

        if (currentMember.getRole() != ProjectRole.OWNER
                && currentMember.getRole() != ProjectRole.MANAGER) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bạn không có quyền quản lý thành viên dự án"
            );
        }

        return project;
    }

    private ProjectMember findMember(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserIdAndRemovedAtIsNull(projectId, userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thành viên dự án"));
    }

    private ProjectMemberResponse toResponse(ProjectMember member) {
        return new ProjectMemberResponse(
                member.getUser().getId(),
                member.getUser().getFullName(),
                member.getUser().getEmail(),
                member.getUser().getAvatarUrl(),
                member.getRole(),
                member.getJoinedAt()
        );
    }
}
