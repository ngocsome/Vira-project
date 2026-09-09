package vn.vira.task.api;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.vira.label.api.LabelResponse;
import vn.vira.shared.api.ApiResponse;
import vn.vira.task.application.TaskMetadataService;
@RestController @RequestMapping("/projects/{projectId}/tasks/{taskId}") @RequiredArgsConstructor
public class TaskMetadataController {
 private final TaskMetadataService service;
 @GetMapping("/labels") public ApiResponse<List<LabelResponse>> labels(@PathVariable Long projectId,@PathVariable Long taskId){return ApiResponse.ok(service.labels(projectId,taskId),"Lấy nhãn công việc thành công");}
 @PutMapping("/labels") public ApiResponse<List<LabelResponse>> labels(@PathVariable Long projectId,@PathVariable Long taskId,@Valid @RequestBody UpdateTaskLabelsRequest request){return ApiResponse.ok(service.replaceLabels(projectId,taskId,request.labelIds()),"Cập nhật nhãn công việc thành công");}
 @GetMapping("/links") public ApiResponse<List<TaskLinkResponse>> links(@PathVariable Long projectId,@PathVariable Long taskId){return ApiResponse.ok(service.links(projectId,taskId),"Lấy liên kết công việc thành công");}
 @PostMapping("/links") public ApiResponse<TaskLinkResponse> add(@PathVariable Long projectId,@PathVariable Long taskId,@Valid @RequestBody TaskLinkRequest request){return ApiResponse.ok(service.addLink(projectId,taskId,request),"Tạo liên kết công việc thành công");}
 @DeleteMapping("/links/{linkId}") public ApiResponse<Void> delete(@PathVariable Long projectId,@PathVariable Long taskId,@PathVariable Long linkId){service.removeLink(projectId,taskId,linkId);return ApiResponse.ok(null,"Xóa liên kết công việc thành công");}
}
