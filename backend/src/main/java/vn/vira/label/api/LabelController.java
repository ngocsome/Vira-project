package vn.vira.label.api;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.vira.label.application.LabelService;
import vn.vira.shared.api.ApiResponse;
@RestController @RequestMapping("/projects/{projectId}/labels") @RequiredArgsConstructor
public class LabelController {
 private final LabelService service;
 @GetMapping public ApiResponse<List<LabelResponse>> find(@PathVariable Long projectId) { return ApiResponse.ok(service.find(projectId), "Lấy nhãn thành công"); }
 @PostMapping public ApiResponse<LabelResponse> create(@PathVariable Long projectId, @Valid @RequestBody CreateLabelRequest request) { return ApiResponse.ok(service.create(projectId, request), "Tạo nhãn thành công"); }
 @PutMapping("/{labelId}") public ApiResponse<LabelResponse> update(@PathVariable Long projectId, @PathVariable Long labelId, @Valid @RequestBody CreateLabelRequest request) { return ApiResponse.ok(service.update(projectId,labelId,request), "Cập nhật nhãn thành công"); }
 @DeleteMapping("/{labelId}") public ApiResponse<Void> delete(@PathVariable Long projectId, @PathVariable Long labelId) { service.delete(projectId,labelId); return ApiResponse.ok(null,"Xóa nhãn thành công"); }
}
