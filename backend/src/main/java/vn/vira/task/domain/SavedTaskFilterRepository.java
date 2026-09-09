package vn.vira.task.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedTaskFilterRepository extends JpaRepository<SavedTaskFilter, Long> {
 List<SavedTaskFilter> findByProjectIdAndUserIdOrderByUpdatedAtDesc(Long projectId, Long userId);
 Optional<SavedTaskFilter> findByIdAndProjectIdAndUserId(Long id, Long projectId, Long userId);
}
