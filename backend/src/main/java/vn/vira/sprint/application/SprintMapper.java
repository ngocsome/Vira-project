package vn.vira.sprint.application;

import org.mapstruct.Mapper;
import vn.vira.sprint.api.SprintResponse;
import vn.vira.sprint.domain.Sprint;

@Mapper(componentModel = "spring")
public interface SprintMapper {

    SprintResponse toResponse(Sprint sprint);
}
