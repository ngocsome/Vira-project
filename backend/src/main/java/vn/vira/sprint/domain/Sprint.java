package vn.vira.sprint.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.vira.project.domain.Project;
import vn.vira.shared.persistence.BaseEntity;

@Getter
@Setter
@Entity
@Table(name = "sprints")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Sprint extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 1000)
    private String goal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SprintStatus status = SprintStatus.PLANNED;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    public Sprint(Project project, String name, String goal, LocalDate startDate, LocalDate endDate) {
        this.project = project;
        this.name = name;
        this.goal = goal;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
