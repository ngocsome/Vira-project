package vn.vira.audit.domain;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ActivityLogRepository extends JpaRepository<ActivityLog,Long> { List<ActivityLog> findTop100ByProjectIdOrderByCreatedAtDesc(Long projectId); List<ActivityLog> findTop100ByTaskIdOrderByCreatedAtDesc(Long taskId); }
