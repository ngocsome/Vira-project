package vn.vira.workspace.application;

import java.util.List;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;
import vn.vira.workspace.api.CreateWorkspaceRequest;
import vn.vira.workspace.api.WorkspaceResponse;
import vn.vira.workspace.api.UpdateWorkspaceRequest;
import vn.vira.workspace.domain.Workspace;
import vn.vira.workspace.domain.WorkspaceMember;
import vn.vira.workspace.domain.WorkspaceMemberRepository;
import vn.vira.workspace.domain.WorkspaceRepository;
import vn.vira.workspace.domain.WorkspaceRole;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    @Transactional
    public WorkspaceResponse create(CreateWorkspaceRequest request) {
        User owner = findUser(currentUser.id());
        Workspace workspace = workspaceRepository.save(new Workspace(
                request.name().trim(),
                normalize(request.description()),
                owner
        ));

        workspaceMemberRepository.save(new WorkspaceMember(workspace, owner, WorkspaceRole.OWNER));
        return toResponse(workspace);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> findMyWorkspaces() {
        return workspaceRepository.findActiveByMemberId(currentUser.id())
                .stream()
                .map(this::toResponse)
                .toList();
    }
    @Transactional(readOnly = true)
    public List<WorkspaceResponse> findArchived() { return workspaceRepository.findArchivedByMemberId(currentUser.id()).stream().map(this::toResponse).toList(); }

    @Transactional(readOnly = true)
    public Workspace requireMember(Long workspaceId) {
        Long userId = currentUser.id();

        if (!workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new NotFoundException("Không tìm thấy không gian làm việc");
        }

        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy không gian làm việc"));
    }

    @Transactional
    public WorkspaceResponse update(Long workspaceId, UpdateWorkspaceRequest request) {
        Workspace workspace = requireOwner(workspaceId);
        workspace.setName(request.name().trim());
        workspace.setDescription(normalize(request.description()));
        return toResponse(workspace);
    }

    @Transactional
    public WorkspaceResponse archive(Long workspaceId) {
        Workspace workspace = requireOwner(workspaceId);
        workspace.setArchivedAt(Instant.now());
        return toResponse(workspace);
    }
    @Transactional
    public WorkspaceResponse restore(Long workspaceId) { Workspace workspace=requireOwner(workspaceId); workspace.setArchivedAt(null); return toResponse(workspace); }

    private Workspace requireOwner(Long workspaceId) {
        Workspace workspace = requireMember(workspaceId);
        if (!workspace.getOwner().getId().equals(currentUser.id())) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ chủ sở hữu mới có thể cấu hình không gian làm việc");
        }
        return workspace;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private WorkspaceResponse toResponse(Workspace workspace) {
        return new WorkspaceResponse(
                workspace.getId(),
                workspace.getName(),
                workspace.getDescription(),
                workspace.getOwner().getId()
        );
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
