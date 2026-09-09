package vn.vira.task.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import vn.vira.project.domain.Project;
import vn.vira.shared.persistence.BaseEntity;
import vn.vira.user.domain.User;

@Getter @Entity @Table(name = "saved_task_filters", uniqueConstraints = @UniqueConstraint(columnNames = {"project_id", "user_id", "name"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SavedTaskFilter extends BaseEntity {
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "project_id") private Project project;
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
 @Column(nullable = false, length = 120) private String name;
 @Column(nullable = false, columnDefinition = "TEXT") private String filters;
 public SavedTaskFilter(Project project, User user, String name, String filters) { this.project=project; this.user=user; this.name=name; this.filters=filters; }
}
