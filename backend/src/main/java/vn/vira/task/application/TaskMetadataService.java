package vn.vira.task.application;
import java.util.LinkedHashSet;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.label.api.LabelResponse;
import vn.vira.label.domain.Label;
import vn.vira.label.domain.LabelRepository;
import vn.vira.audit.application.ActivityLogService;
import vn.vira.project.application.ProjectService;
import vn.vira.shared.exception.BusinessException;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.task.api.TaskLinkRequest;
import vn.vira.task.api.TaskLinkResponse;
import vn.vira.task.domain.*;
@Service @RequiredArgsConstructor
public class TaskMetadataService {
 private final TaskRepository tasks; private final LabelRepository labels; private final TaskLinkRepository links; private final ProjectService projects; private final TaskAuthorizationService authorization; private final ActivityLogService audit;
 @Transactional public List<LabelResponse> replaceLabels(Long projectId, Long taskId, List<Long> labelIds) { Task task=require(projectId,taskId); authorization.requireTaskEditor(task); var ids=new LinkedHashSet<>(labelIds); var selected=labels.findAllById(ids); if(selected.size()!=ids.size() || selected.stream().anyMatch(label -> !label.getProject().getId().equals(projectId))) throw new BusinessException("Nhãn phải thuộc project hiện tại"); task.setLabels(new LinkedHashSet<>(selected)); audit.record(task,"TASK_LABELS_UPDATED","Cập nhật nhãn công việc"); return task.getLabels().stream().map(this::label).toList(); }
 @Transactional(readOnly=true) public List<LabelResponse> labels(Long projectId, Long taskId) { return require(projectId,taskId).getLabels().stream().map(this::label).toList(); }
 @Transactional public TaskLinkResponse addLink(Long projectId, Long taskId, TaskLinkRequest request) { Task source=require(projectId,taskId); authorization.requireTaskEditor(source); Task target=require(projectId,request.targetTaskId()); if(source.getId().equals(target.getId())) throw new BusinessException("Không thể liên kết công việc với chính nó"); var link=links.save(new TaskLink(source,target,request.linkType())); audit.record(source,"TASK_LINK_ADDED","Liên kết với " + target.getTaskCode()); return map(link); }
 @Transactional(readOnly=true) public List<TaskLinkResponse> links(Long projectId, Long taskId) { require(projectId,taskId); return links.findBySourceTaskIdOrTargetTaskId(taskId,taskId).stream().map(this::map).toList(); }
 @Transactional public void removeLink(Long projectId, Long taskId, Long linkId) { Task task=require(projectId,taskId); authorization.requireTaskEditor(task); TaskLink link=links.findById(linkId).orElseThrow(()->new NotFoundException("Không tìm thấy liên kết công việc")); if(!link.getSourceTask().getId().equals(taskId) && !link.getTargetTask().getId().equals(taskId)) throw new NotFoundException("Không tìm thấy liên kết công việc"); links.delete(link); audit.record(task,"TASK_LINK_REMOVED","Gỡ liên kết công việc"); }
 private Task require(Long projectId, Long taskId) { projects.requireMember(projectId); return tasks.findByIdAndProjectIdAndDeletedAtIsNull(taskId,projectId).orElseThrow(()->new NotFoundException("Không tìm thấy công việc")); }
 private LabelResponse label(Label label) { return new LabelResponse(label.getId(),label.getName(),label.getColor()); }
 private TaskLinkResponse map(TaskLink link) { return new TaskLinkResponse(link.getId(),link.getSourceTask().getId(),link.getSourceTask().getTaskCode(),link.getTargetTask().getId(),link.getTargetTask().getTaskCode(),link.getTargetTask().getTitle(),link.getLinkType()); }
}
