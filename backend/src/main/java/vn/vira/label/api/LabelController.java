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
}
