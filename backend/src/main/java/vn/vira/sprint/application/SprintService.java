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

@Service
@RequiredArgsConstructor
public class SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectService projectService;
    private final SprintMapper sprintMapper;

    @Transactional
    public SprintResponse create(Long projectId, CreateSprintRequest request) {
        Project project = projectService.requireMember(projectId);

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
        projectService.requireMember(projectId);

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
    public SprintResponse complete(Long projectId, Long sprintId) {
        projectService.requireMember(projectId);
        Sprint sprint = find(projectId, sprintId);

        if (sprint.getStatus() != SprintStatus.ACTIVE) {
            throw new BusinessException("Chỉ có thể kết thúc Sprint đang diễn ra");
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
