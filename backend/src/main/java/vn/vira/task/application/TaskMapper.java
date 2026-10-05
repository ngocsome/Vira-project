package vn.vira.task.application;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.vira.task.api.TaskResponse;
import vn.vira.task.domain.Task;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(target = "parentTaskId", source = "parentTask.id")
    @Mapping(target = "reporterId", source = "reporter.id")
    @Mapping(target = "sprintId", source = "sprint.id")
    @Mapping(target = "assigneeIds", expression = "java(task.getAssignees().stream().map(user -> user.getId()).toList())")
    TaskResponse toResponse(Task task);
}
