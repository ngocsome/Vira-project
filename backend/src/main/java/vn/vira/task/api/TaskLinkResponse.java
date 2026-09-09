package vn.vira.task.api;
import vn.vira.task.domain.TaskLinkType;
public record TaskLinkResponse(Long id, Long sourceTaskId, String sourceTaskCode, Long targetTaskId, String targetTaskCode, String targetTaskTitle, TaskLinkType linkType) { }
