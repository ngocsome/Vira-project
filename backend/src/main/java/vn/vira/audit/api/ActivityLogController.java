package vn.vira.audit.api;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.vira.audit.application.ActivityLogService;
import vn.vira.shared.api.ApiResponse;
import vn.vira.task.domain.TaskRepository;
import vn.vira.shared.exception.NotFoundException;
@RestController @RequestMapping("/projects/{projectId}") @RequiredArgsConstructor
public class ActivityLogController {
 private final ActivityLogService service; private final TaskRepository tasks;
 @GetMapping("/activity") public ApiResponse<List<ActivityLogResponse>> project(@PathVariable Long projectId){return ApiResponse.ok(service.project(projectId),"Lấy lịch sử dự án thành công");}
 @GetMapping("/tasks/{taskId}/activity") public ApiResponse<List<ActivityLogResponse>> task(@PathVariable Long projectId,@PathVariable Long taskId){var task=tasks.findByIdAndProjectIdAndDeletedAtIsNull(taskId,projectId).orElseThrow(()->new NotFoundException("Không tìm thấy công việc"));return ApiResponse.ok(service.task(projectId,task),"Lấy lịch sử công việc thành công");}
}
