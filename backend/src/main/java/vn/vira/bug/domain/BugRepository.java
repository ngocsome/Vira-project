package vn.vira.bug.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BugRepository extends JpaRepository<Bug, Long> {

    Optional<Bug> findByTaskId(Long taskId);
}
