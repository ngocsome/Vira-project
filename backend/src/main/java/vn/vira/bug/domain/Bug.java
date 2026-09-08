package vn.vira.bug.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.vira.task.domain.Task;

@Getter
@Setter
@Entity
@Table(name = "bugs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Bug {

    @Id
    @Column(name = "task_id")
    private Long taskId;

    @OneToOne(optional = false)
    @MapsId
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(length = 120)
    private String environment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BugSeverity severity;

    @Column(columnDefinition = "TEXT")
    private String reproductionSteps;

    @Column(columnDefinition = "TEXT")
    private String expectedResult;

    @Column(columnDefinition = "TEXT")
    private String actualResult;

    @Column(length = 100)
    private String affectedVersion;

    public Bug(
            Task task,
            String environment,
            BugSeverity severity,
            String reproductionSteps,
            String expectedResult,
            String actualResult,
            String affectedVersion
    ) {
        this.task = task;
        this.taskId = task.getId();
        this.environment = environment;
        this.severity = severity;
        this.reproductionSteps = reproductionSteps;
        this.expectedResult = expectedResult;
        this.actualResult = actualResult;
        this.affectedVersion = affectedVersion;
    }
}
