package vn.vira.team.domain;

import jakarta.persistence.*;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.*;
import vn.vira.project.domain.Project;
import vn.vira.shared.persistence.BaseEntity;
import vn.vira.user.domain.User;

@Getter @Setter @Entity @Table(name = "project_teams") @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectTeam extends BaseEntity {
 @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "project_id") private Project project;
 @Column(nullable = false, length = 120) private String name;
 @Column(length = 500) private String description;
 @ManyToMany @JoinTable(name = "project_team_members", joinColumns = @JoinColumn(name = "team_id"), inverseJoinColumns = @JoinColumn(name = "user_id")) private Set<User> members = new LinkedHashSet<>();
 public ProjectTeam(Project project, String name, String description) { this.project=project; this.name=name; this.description=description; }
}
