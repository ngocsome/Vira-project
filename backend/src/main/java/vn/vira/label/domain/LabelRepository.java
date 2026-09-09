package vn.vira.label.domain;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
public interface LabelRepository extends JpaRepository<Label, Long> {
 List<Label> findByProjectIdOrderByNameAsc(Long projectId);
 @Modifying @Query(value = "delete from task_labels where label_id = :labelId", nativeQuery = true) void removeTaskMappings(Long labelId);
}
