package vn.vira.task.domain;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectTaskCounterRepository extends JpaRepository<ProjectTaskCounter, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select counter from ProjectTaskCounter counter where counter.projectId = :projectId")
    Optional<ProjectTaskCounter> findForUpdate(@Param("projectId") Long projectId);
}
