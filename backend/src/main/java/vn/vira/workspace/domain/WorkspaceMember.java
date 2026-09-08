package vn.vira.workspace.domain;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import vn.vira.user.domain.User;

@Getter
@Entity
@Table(name = "workspace_members")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WorkspaceMember {

    @EmbeddedId
    private WorkspaceMemberId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("workspaceId")
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private WorkspaceRole role;

    private Instant joinedAt;

    public WorkspaceMember(Workspace workspace, User user, WorkspaceRole role) {
        this.id = new WorkspaceMemberId(workspace.getId(), user.getId());
        this.workspace = workspace;
        this.user = user;
        this.role = role;
        this.joinedAt = Instant.now();
    }
}
