package vn.vira.team.api;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import vn.vira.shared.api.ApiResponse;
import vn.vira.team.application.TeamService;
@RestController @RequestMapping("/projects/{projectId}/teams") @RequiredArgsConstructor public class TeamController {
 private final TeamService service;
 @GetMapping public ApiResponse<List<TeamResponse>> find(@PathVariable Long projectId){return ApiResponse.ok(service.find(projectId),"Lấy danh sách nhóm thành công");}
 @PostMapping public ApiResponse<TeamResponse> create(@PathVariable Long projectId,@Valid @RequestBody TeamRequests.Save request){return ApiResponse.ok(service.create(projectId,request),"Tạo nhóm thành công");}
 @PutMapping("/{teamId}") public ApiResponse<TeamResponse> update(@PathVariable Long projectId,@PathVariable Long teamId,@Valid @RequestBody TeamRequests.Save request){return ApiResponse.ok(service.update(projectId,teamId,request),"Cập nhật nhóm thành công");}
 @PutMapping("/{teamId}/members") public ApiResponse<TeamResponse> members(@PathVariable Long projectId,@PathVariable Long teamId,@Valid @RequestBody TeamRequests.Members request){return ApiResponse.ok(service.members(projectId,teamId,request),"Cập nhật thành viên nhóm thành công");}
 @DeleteMapping("/{teamId}") public ApiResponse<Void> delete(@PathVariable Long projectId,@PathVariable Long teamId){service.delete(projectId,teamId);return ApiResponse.ok(null,"Xóa nhóm thành công");}
}
