package vn.vira.task.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "project_task_counters")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectTaskCounter {

    @Id
    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "next_sequence", nullable = false)
    private Long nextSequence;

    public ProjectTaskCounter(Long projectId) {
        this.projectId = projectId;
        this.nextSequence = 101L;
    }

    public long takeNext() {
        return nextSequence++;
    }
}
