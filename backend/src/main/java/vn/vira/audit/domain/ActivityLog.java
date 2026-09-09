package vn.vira.audit.domain;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import vn.vira.project.domain.Project;
import vn.vira.task.domain.Task;
import vn.vira.user.domain.User;
@Getter @Entity @Table(name="activity_logs") @NoArgsConstructor
public class ActivityLog {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="project_id") private Project project;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="task_id") private Task task;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="actor_id") private User actor;
 private String action;
 @Column(columnDefinition="JSON") private String details;
 @Column(nullable=false, updatable=false) private Instant createdAt;
 public ActivityLog(Project project, Task task, User actor, String action, String details) { this.project=project;this.task=task;this.actor=actor;this.action=action;this.details=details;this.createdAt=Instant.now(); }
}
