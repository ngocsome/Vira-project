package vn.vira.label.application;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.label.api.CreateLabelRequest;
import vn.vira.label.api.LabelResponse;
import vn.vira.label.domain.Label;
import vn.vira.label.domain.LabelRepository;
import vn.vira.project.application.ProjectService;
import vn.vira.project.domain.Project;
@Service @RequiredArgsConstructor
public class LabelService {
  private final LabelRepository labels; private final ProjectService projects;
  @Transactional(readOnly=true) public List<LabelResponse> find(Long projectId) { projects.requireMember(projectId); return labels.findByProjectIdOrderByNameAsc(projectId).stream().map(this::map).toList(); }
  @Transactional public LabelResponse create(Long projectId, CreateLabelRequest request) { Project project=projects.requireManager(projectId); return map(labels.save(new Label(project, request.name().trim(), request.color()))); }
  private LabelResponse map(Label label) { return new LabelResponse(label.getId(), label.getName(), label.getColor()); }
}
