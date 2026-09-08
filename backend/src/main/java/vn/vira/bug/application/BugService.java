package vn.vira.bug.application;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.bug.api.BugResponse;
import vn.vira.bug.api.UpsertBugRequest;
import vn.vira.bug.domain.Bug;
import vn.vira.bug.domain.BugRepository;
import vn.vira.project.application.ProjectService;
import vn.vira.shared.exception.BusinessException;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.task.domain.Task;
import vn.vira.task.domain.TaskRepository;
import vn.vira.task.domain.TaskType;

@Service
@RequiredArgsConstructor
public class BugService {

    private final BugRepository bugRepository;
    private final TaskRepository taskRepository;
    private final ProjectService projectService;

    @Transactional
    public BugResponse upsert(Long projectId, Long taskId, UpsertBugRequest request) {
        projectService.requireMember(projectId);
        Task task = taskRepository.findByIdAndProjectIdAndDeletedAtIsNull(taskId, projectId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy công việc"));

        if (task.getTaskType() != TaskType.BUG) {
            throw new BusinessException("Chỉ công việc loại BUG mới có thông tin lỗi chi tiết");
        }

        Bug bug = bugRepository.findByTaskId(taskId)
                .orElseGet(() -> new Bug(task, null, request.severity(), null, null, null, null));

        bug.setEnvironment(normalize(request.environment()));
        bug.setSeverity(request.severity());
        bug.setReproductionSteps(normalize(request.reproductionSteps()));
        bug.setExpectedResult(normalize(request.expectedResult()));
        bug.setActualResult(normalize(request.actualResult()));
        bug.setAffectedVersion(normalize(request.affectedVersion()));

        return toResponse(bugRepository.save(bug));
    }

    @Transactional(readOnly = true)
    public BugResponse find(Long projectId, Long taskId) {
        projectService.requireMember(projectId);

        return bugRepository.findByTaskId(taskId)
                .map(this::toResponse)
                .orElseThrow(() -> new NotFoundException("Công việc chưa có thông tin lỗi chi tiết"));
    }

    private BugResponse toResponse(Bug bug) {
        return new BugResponse(
                bug.getTaskId(),
                bug.getEnvironment(),
                bug.getSeverity(),
                bug.getReproductionSteps(),
                bug.getExpectedResult(),
                bug.getActualResult(),
                bug.getAffectedVersion()
        );
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
