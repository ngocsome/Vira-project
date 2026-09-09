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
import vn.vira.shared.exception.NotFoundException;
@Service @RequiredArgsConstructor
public class LabelService {
  private final LabelRepository labels; private final ProjectService projects;
  @Transactional(readOnly=true) public List<LabelResponse> find(Long projectId) { projects.requireMember(projectId); return labels.findByProjectIdOrderByNameAsc(projectId).stream().map(this::map).toList(); }
  @Transactional public LabelResponse create(Long projectId, CreateLabelRequest request) { Project project=projects.requireManager(projectId); return map(labels.save(new Label(project, request.name().trim(), request.color()))); }
  @Transactional public LabelResponse update(Long projectId, Long labelId, CreateLabelRequest request) { projects.requireManager(projectId); Label label=require(projectId,labelId); label.update(request.name().trim(),request.color()); return map(label); }
  @Transactional public void delete(Long projectId, Long labelId) { projects.requireManager(projectId); Label label=require(projectId,labelId); labels.removeTaskMappings(labelId); labels.delete(label); }
  private Label require(Long projectId, Long labelId) { return labels.findById(labelId).filter(label -> label.getProject().getId().equals(projectId)).orElseThrow(() -> new NotFoundException("Không tìm thấy nhãn")); }
  private LabelResponse map(Label label) { return new LabelResponse(label.getId(), label.getName(), label.getColor()); }
}
