package vn.vira.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.vira.shared.persistence.BaseEntity;
import vn.vira.user.domain.User;
import vn.vira.workspace.domain.Workspace;

@Getter
@Setter
@Entity
@Table(name = "projects")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 180)
    private String name;

    @Column(name = "project_key", nullable = false, length = 12)
    private String projectKey;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "project_type", nullable = false, length = 20)
    private ProjectType projectType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status = ProjectStatus.ACTIVE;

    private LocalDate startDate;

    private LocalDate targetEndDate;

    private Instant archivedAt;

    public Project(
            Workspace workspace,
            User owner,
            String name,
            String projectKey,
            String description,
            ProjectType projectType,
            LocalDate startDate,
            LocalDate targetEndDate
    ) {
        this.workspace = workspace;
        this.owner = owner;
        this.name = name;
        this.projectKey = projectKey;
        this.description = description;
        this.projectType = projectType;
        this.startDate = startDate;
        this.targetEndDate = targetEndDate;
    }
}
