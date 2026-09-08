package vn.vira.workspace.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, WorkspaceMemberId> {

    boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);
}
