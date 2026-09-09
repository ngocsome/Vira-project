package vn.vira.task.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TaskStatusHistoryRepository extends JpaRepository<TaskStatusHistory, Long> {
 @Query("select h from TaskStatusHistory h join fetch h.task task where task.project.id = :projectId order by h.changedAt asc")
 List<TaskStatusHistory> findByProjectIdOrderByChangedAtAsc(Long projectId);
}
