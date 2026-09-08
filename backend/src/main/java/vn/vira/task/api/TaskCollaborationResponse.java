package vn.vira.task.api;

import java.util.List;

public record TaskCollaborationResponse(
        List<TaskParticipantResponse> assignees,
        List<TaskParticipantResponse> watchers,
        boolean currentUserAssigned,
        boolean currentUserWatching,
        boolean canManageParticipants
) {
}
