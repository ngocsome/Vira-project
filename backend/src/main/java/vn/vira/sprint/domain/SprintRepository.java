package vn.vira.sprint.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SprintRepository extends JpaRepository<Sprint, Long> {

    List<Sprint> findByProjectIdOrderByStartDateDesc(Long projectId);

    Optional<Sprint> findByProjectIdAndStatus(Long projectId, SprintStatus status);

    Optional<Sprint> findByIdAndProjectId(Long id, Long projectId);
}
