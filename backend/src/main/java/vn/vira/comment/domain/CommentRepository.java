package vn.vira.comment.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByTaskIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long taskId);

    Optional<Comment> findByIdAndTaskIdAndDeletedAtIsNull(Long id, Long taskId);
}
