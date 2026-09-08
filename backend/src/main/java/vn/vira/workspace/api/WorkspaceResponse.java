package vn.vira.workspace.api;

public record WorkspaceResponse(
        Long id,
        String name,
        String description,
        Long ownerId
) {
}
