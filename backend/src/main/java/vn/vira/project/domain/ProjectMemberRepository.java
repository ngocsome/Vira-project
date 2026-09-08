package vn.vira.project.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {

    boolean existsByProjectIdAndUserIdAndRemovedAtIsNull(Long projectId, Long userId);

    List<ProjectMember> findByProjectIdAndRemovedAtIsNullOrderByJoinedAtAsc(Long projectId);

    Optional<ProjectMember> findByProjectIdAndUserIdAndRemovedAtIsNull(Long projectId, Long userId);
}
