package vn.vira.label.domain;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface LabelRepository extends JpaRepository<Label, Long> { List<Label> findByProjectIdOrderByNameAsc(Long projectId); }
