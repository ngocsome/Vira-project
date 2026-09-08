package vn.vira.project.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByWorkspaceIdAndProjectKeyIgnoreCase(Long workspaceId, String projectKey);

    List<Project> findByWorkspaceIdAndArchivedAtIsNullOrderByUpdatedAtDesc(Long workspaceId);

    Optional<Project> findByIdAndArchivedAtIsNull(Long id);
}
