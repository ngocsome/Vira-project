package vn.vira.workspace.domain;

import java.io.Serializable;
import jakarta.persistence.Embeddable;

@Embeddable
public record WorkspaceMemberId(Long workspaceId, Long userId) implements Serializable {
}
