package vn.vira.task.domain;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @Entity @Table(name = "task_status_history") @NoArgsConstructor
public class TaskStatusHistory {
 @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "task_id") private Task task;
 @Enumerated(EnumType.STRING) @Column(nullable = false) private TaskStatus status;
 @Column(nullable = false) private Instant changedAt;
 public TaskStatusHistory(Task task, TaskStatus status) { this.task=task; this.status=status; this.changedAt=Instant.now(); }
}
