package vn.vira.label.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import vn.vira.project.domain.Project;

@Getter
@Entity
@Table(name = "labels")
@NoArgsConstructor
public class Label {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "project_id") private Project project;
    private String name;
    private String color;
    public Label(Project project, String name, String color) { this.project = project; this.name = name; this.color = color; }
    public void update(String name, String color) { this.name = name; this.color = color; }
}
