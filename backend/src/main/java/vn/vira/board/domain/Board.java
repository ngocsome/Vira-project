package vn.vira.board.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import vn.vira.project.domain.Project;
import vn.vira.shared.persistence.BaseEntity;

@Getter
@Entity
@Table(name = "boards")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Board extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(name = "is_default", nullable = false)
    private boolean defaultBoard;

    public Board(Project project, String name, boolean defaultBoard) {
        this.project = project;
        this.name = name;
        this.defaultBoard = defaultBoard;
    }
}
