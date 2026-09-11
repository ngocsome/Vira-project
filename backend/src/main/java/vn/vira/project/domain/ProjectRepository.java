package vn.vira.project.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByWorkspaceIdAndProjectKeyIgnoreCase(Long workspaceId, String projectKey);

    List<Project> findByWorkspaceIdAndArchivedAtIsNullOrderByUpdatedAtDesc(Long workspaceId);

    @Query("""
            select distinct p from Project p
            join ProjectMember pm on pm.project.id = p.id
            where p.workspace.id = :workspaceId
              and p.archivedAt is null
              and pm.user.id = :userId
              and pm.removedAt is null
            order by p.updatedAt desc
            """)
    List<Project> findActiveByWorkspaceIdAndMemberUserId(Long workspaceId, Long userId);

    List<Project> findByWorkspaceIdAndArchivedAtIsNotNullOrderByUpdatedAtDesc(Long workspaceId);

    Optional<Project> findByIdAndArchivedAtIsNull(Long id);
}
