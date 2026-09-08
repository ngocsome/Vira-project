package vn.vira.board.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import vn.vira.shared.persistence.BaseEntity;
import vn.vira.task.domain.TaskStatus;

@Getter
@Entity
@Table(name = "board_columns")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardColumn extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "task_status", nullable = false, length = 30)
    private TaskStatus taskStatus;

    @Column(nullable = false)
    private Integer position;

    @Column(name = "wip_limit")
    private Integer wipLimit;

    public BoardColumn(Board board, String name, TaskStatus taskStatus, int position) {
        this.board = board;
        this.name = name;
        this.taskStatus = taskStatus;
        this.position = position;
    }

    public void configure(String newName, Integer newWipLimit) {
        this.name = newName;
        this.wipLimit = newWipLimit;
    }
}
