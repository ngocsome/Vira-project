package vn.vira.task.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    List<Task> findByProjectIdAndDeletedAtIsNullOrderByPositionAsc(Long projectId);

    List<Task> findByProjectIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long projectId);

    Optional<Task> findByIdAndProjectIdAndDeletedAtIsNull(Long id, Long projectId);

    Optional<Task> findByIdAndProjectIdAndDeletedAtIsNotNull(Long id, Long projectId);

    List<Task> findByProjectIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long projectId);

    long countByProjectIdAndDeletedAtIsNull(Long projectId);

    boolean existsByParentTaskIdAndStatusNotAndDeletedAtIsNull(Long parentTaskId, TaskStatus status);

    long countByProjectIdAndStatusAndDeletedAtIsNull(Long projectId, TaskStatus status);

    long countByProjectIdAndTaskTypeAndStatusNotAndDeletedAtIsNull(
            Long projectId,
            TaskType taskType,
            TaskStatus status
    );

    long countByProjectIdAndDueDateBeforeAndStatusNotAndDeletedAtIsNull(
            Long projectId,
            java.time.LocalDate dueDate,
            TaskStatus status
    );

    List<Task> findByProjectIdAndSprintIsNullAndStatusNotAndDeletedAtIsNullOrderByPositionAsc(
            Long projectId,
            TaskStatus status
    );
}
