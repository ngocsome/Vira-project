package vn.vira.team.domain;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ProjectTeamRepository extends JpaRepository<ProjectTeam, Long> {
 List<ProjectTeam> findByProjectIdOrderByNameAsc(Long projectId);
 Optional<ProjectTeam> findByIdAndProjectId(Long id, Long projectId);
 boolean existsByProjectIdAndNameIgnoreCase(Long projectId, String name);
}
