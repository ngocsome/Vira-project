package vn.vira.project.application;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import vn.vira.project.api.ProjectResponse;
import vn.vira.project.domain.Project;

@Mapper(componentModel = "spring")
public interface ProjectMapper {

    @Mapping(target = "workspaceId", source = "workspace.id")
    @Mapping(target = "ownerId", source = "owner.id")
    ProjectResponse toResponse(Project project);
}
