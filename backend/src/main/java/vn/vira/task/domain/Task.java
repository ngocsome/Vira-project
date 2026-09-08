package vn.vira.task.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.vira.project.domain.Project;
import vn.vira.shared.persistence.BaseEntity;
import vn.vira.sprint.domain.Sprint;
import vn.vira.user.domain.User;

@Getter
@Setter
@Entity
@Table(name = "tasks")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Task extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sprint_id")
    private Sprint sprint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_task_id")
    private Task parentTask;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToMany
    @JoinTable(
            name = "task_assignees",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> assignees = new LinkedHashSet<>();

    @ManyToMany
    @JoinTable(
            name = "task_watchers",
            joinColumns = @JoinColumn(name = "task_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> watchers = new LinkedHashSet<>();

    @Column(name = "task_code", nullable = false, length = 30)
    private String taskCode;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 30)
    private TaskType taskType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TaskPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TaskStatus status = TaskStatus.TODO;

    private LocalDate dueDate;

    private BigDecimal estimatedHours;

    private Integer storyPoints;

    @Column(nullable = false)
    private Long position;

    private Instant completedAt;

    private Instant deletedAt;

    public Task(
            Project project,
            Task parentTask,
            User reporter,
            String taskCode,
            String title,
            String description,
            TaskType taskType,
            TaskPriority priority,
            LocalDate dueDate,
            BigDecimal estimatedHours,
            Integer storyPoints,
            Long position
    ) {
        this.project = project;
        this.parentTask = parentTask;
        this.reporter = reporter;
        this.taskCode = taskCode;
        this.title = title;
        this.description = description;
        this.taskType = taskType;
        this.priority = priority;
        this.dueDate = dueDate;
        this.estimatedHours = estimatedHours;
        this.storyPoints = storyPoints;
        this.position = position;
    }

    public void changeStatus(TaskStatus newStatus) {
        this.status = newStatus;
        this.completedAt = newStatus == TaskStatus.DONE ? Instant.now() : null;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void assignToSprint(Sprint sprint) {
        this.sprint = sprint;
    }

    public void move(TaskStatus status, Long position) {
        changeStatus(status);
        this.position = position;
    }
}
