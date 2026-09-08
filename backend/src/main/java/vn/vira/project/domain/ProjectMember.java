package vn.vira.project.domain;

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
@Table(name = "project_members")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectMember {

    @EmbeddedId
    private ProjectMemberId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("projectId")
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private ProjectRole role;

    private Instant joinedAt;

    private Instant removedAt;

    public ProjectMember(Project project, User user, ProjectRole role) {
        this.id = new ProjectMemberId(project.getId(), user.getId());
        this.project = project;
        this.user = user;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    public void changeRole(ProjectRole role) {
        this.role = role;
    }

    public void remove() {
        this.removedAt = Instant.now();
    }
}
