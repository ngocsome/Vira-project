package vn.vira.task.domain;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
@Getter @Entity @Table(name="task_links") @NoArgsConstructor
public class TaskLink {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="source_task_id") private Task sourceTask;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="target_task_id") private Task targetTask;
 @Enumerated(EnumType.STRING) private TaskLinkType linkType;
 @Column(nullable=false, updatable=false) private Instant createdAt;
 public TaskLink(Task sourceTask, Task targetTask, TaskLinkType linkType) { this.sourceTask=sourceTask; this.targetTask=targetTask; this.linkType=linkType; this.createdAt=Instant.now(); }
}
