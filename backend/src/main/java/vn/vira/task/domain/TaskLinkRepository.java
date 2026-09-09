package vn.vira.task.domain;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TaskLinkRepository extends JpaRepository<TaskLink, Long> { List<TaskLink> findBySourceTaskIdOrTargetTaskId(Long sourceTaskId, Long targetTaskId); }
