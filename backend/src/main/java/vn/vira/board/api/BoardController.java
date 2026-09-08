package vn.vira.board.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.board.application.BoardService;
import vn.vira.project.application.ProjectService;
import vn.vira.shared.api.ApiResponse;

@RestController
@RequestMapping("/projects/{projectId}/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final ProjectService projectService;

    @GetMapping
    public ApiResponse<BoardResponse> findDefault(@PathVariable Long projectId) {
        projectService.requireMember(projectId);
        return ApiResponse.ok(boardService.findDefault(projectId), "Lấy bảng công việc thành công");
    }

    @PatchMapping("/columns/{columnId}")
    public ApiResponse<BoardColumnResponse> updateColumn(@PathVariable Long projectId, @PathVariable Long columnId, @Valid @RequestBody UpdateBoardColumnRequest request) {
        projectService.requireManager(projectId);
        return ApiResponse.ok(boardService.updateColumn(projectId, columnId, request), "Cập nhật cột bảng thành công");
    }
}
