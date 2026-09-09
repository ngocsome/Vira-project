package vn.vira.audit.application;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.audit.api.ActivityLogResponse;
import vn.vira.audit.domain.ActivityLog;
import vn.vira.audit.domain.ActivityLogRepository;
import vn.vira.project.domain.Project;
import vn.vira.project.domain.ProjectMemberRepository;
import vn.vira.shared.security.CurrentUser;
import vn.vira.task.domain.Task;
import vn.vira.user.domain.UserRepository;
@Service @RequiredArgsConstructor
public class ActivityLogService {
 private final ActivityLogRepository logs; private final UserRepository users; private final ProjectMemberRepository members; private final CurrentUser currentUser;
 @Transactional public void record(Task task,String action,String details) { logs.save(new ActivityLog(task.getProject(),task,users.getReferenceById(currentUser.id()),action,jsonMessage(details))); }
 @Transactional public void recordProject(Project project,String action,String details) { logs.save(new ActivityLog(project,null,users.getReferenceById(currentUser.id()),action,jsonMessage(details))); }
 @Transactional(readOnly=true) public List<ActivityLogResponse> project(Long projectId) { requireMember(projectId); return logs.findTop100ByProjectIdOrderByCreatedAtDesc(projectId).stream().map(this::map).toList(); }
 @Transactional(readOnly=true) public List<ActivityLogResponse> task(Long projectId, Task task) { requireMember(projectId); return logs.findTop100ByTaskIdOrderByCreatedAtDesc(task.getId()).stream().map(this::map).toList(); }
 private ActivityLogResponse map(ActivityLog log) { return new ActivityLogResponse(log.getId(),log.getTask()==null?null:log.getTask().getId(),log.getTask()==null?null:log.getTask().getTaskCode(),log.getActor()==null?null:log.getActor().getId(),log.getActor()==null?"Hệ thống":log.getActor().getFullName(),log.getAction(),log.getDetails(),log.getCreatedAt()); }
 private String jsonMessage(String value) { return "{\"message\":\"" + (value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r")) + "\"}"; }
 private void requireMember(Long projectId) { if (!members.existsByProjectIdAndUserIdAndRemovedAtIsNull(projectId,currentUser.id())) throw new vn.vira.shared.exception.NotFoundException("Không tìm thấy dự án"); }
}
