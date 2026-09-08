package vn.vira.sprint.api;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.shared.api.ApiResponse;
import vn.vira.sprint.application.SprintService;

@RestController
@RequestMapping("/projects/{projectId}/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @GetMapping
    public ApiResponse<List<SprintResponse>> findByProject(@PathVariable Long projectId) {
        return ApiResponse.ok(sprintService.findByProject(projectId), "Lấy danh sách Sprint thành công");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SprintResponse> create(
            @PathVariable Long projectId,
            @Valid @RequestBody CreateSprintRequest request
    ) {
        return ApiResponse.ok(sprintService.create(projectId, request), "Tạo Sprint thành công");
    }

    @PatchMapping("/{sprintId}/start")
    public ApiResponse<SprintResponse> start(
            @PathVariable Long projectId,
            @PathVariable Long sprintId
    ) {
        return ApiResponse.ok(sprintService.start(projectId, sprintId), "Bắt đầu Sprint thành công");
    }

    @PatchMapping("/{sprintId}/complete")
    public ApiResponse<SprintResponse> complete(
            @PathVariable Long projectId,
            @PathVariable Long sprintId
    ) {
        return ApiResponse.ok(sprintService.complete(projectId, sprintId), "Kết thúc Sprint thành công");
    }
}
