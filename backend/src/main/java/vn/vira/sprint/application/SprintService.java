package vn.vira.sprint.application;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.project.application.ProjectService;
import vn.vira.project.domain.Project;
import vn.vira.shared.exception.BusinessException;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.sprint.api.CreateSprintRequest;
import vn.vira.sprint.api.SprintResponse;
import vn.vira.sprint.domain.Sprint;
import vn.vira.sprint.domain.SprintRepository;
import vn.vira.sprint.domain.SprintStatus;
import vn.vira.sprint.api.CompleteSprintRequest;
import vn.vira.task.domain.Task;
import vn.vira.task.domain.TaskRepository;
import vn.vira.task.domain.TaskStatus;

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectService projectService;
    private final SprintMapper sprintMapper;
    private final TaskRepository taskRepository;

    @Transactional
    public SprintResponse create(Long projectId, CreateSprintRequest request) {
        Project project = projectService.requireAdmin(projectId);

        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessException("Ngày kết thúc Sprint không được sớm hơn ngày bắt đầu");
        }

        Sprint sprint = sprintRepository.save(new Sprint(
                project,
                request.name().trim(),
                normalize(request.goal()),
                request.startDate(),
                request.endDate()
        ));

        return sprintMapper.toResponse(sprint);
    }

    @Transactional(readOnly = true)
    public List<SprintResponse> findByProject(Long projectId) {
        projectService.requireMember(projectId);

        return sprintRepository.findByProjectIdOrderByStartDateDesc(projectId)
                .stream()
                .map(sprintMapper::toResponse)
                .toList();
    }

    @Transactional
    public SprintResponse start(Long projectId, Long sprintId) {
        projectService.requireAdmin(projectId);

        if (sprintRepository.findByProjectIdAndStatus(projectId, SprintStatus.ACTIVE).isPresent()) {
            throw new BusinessException("Mỗi dự án chỉ có thể có một Sprint đang diễn ra");
        }

        Sprint sprint = find(projectId, sprintId);

        if (sprint.getStatus() != SprintStatus.PLANNED) {
            throw new BusinessException("Chỉ có thể bắt đầu Sprint đang ở trạng thái kế hoạch");
        }

        sprint.setStatus(SprintStatus.ACTIVE);
        return sprintMapper.toResponse(sprint);
    }

    @Transactional
    public SprintResponse complete(Long projectId, Long sprintId, CompleteSprintRequest request) {
        projectService.requireAdmin(projectId);
        Sprint sprint = find(projectId, sprintId);

        if (sprint.getStatus() != SprintStatus.ACTIVE) {
            throw new BusinessException("Chỉ có thể kết thúc Sprint đang diễn ra");
        }

        Sprint target = null;
        if (request != null && request.targetSprintId() != null) {
            if (request.targetSprintId().equals(sprintId)) throw new BusinessException("Sprint đích phải khác Sprint đang kết thúc");
            target = find(projectId, request.targetSprintId());
            if (target.getStatus() == SprintStatus.COMPLETED) throw new BusinessException("Không thể chuyển công việc vào Sprint đã hoàn thành");
        }
        for (Task task : taskRepository.findByProjectIdAndSprintIdAndStatusNotAndDeletedAtIsNull(projectId, sprintId, TaskStatus.DONE)) {
            task.assignToSprint(target);
        }
        sprint.setStatus(SprintStatus.COMPLETED);
        return sprintMapper.toResponse(sprint);
    }

    private Sprint find(Long projectId, Long sprintId) {
        return sprintRepository.findByIdAndProjectId(sprintId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy Sprint"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
