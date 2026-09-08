package vn.vira.board.application;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.board.api.BoardColumnResponse;
import vn.vira.board.api.BoardResponse;
import vn.vira.board.api.UpdateBoardColumnRequest;
import vn.vira.board.domain.Board;
import vn.vira.board.domain.BoardColumn;
import vn.vira.board.domain.BoardColumnRepository;
import vn.vira.board.domain.BoardRepository;
import vn.vira.project.domain.Project;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.task.domain.TaskStatus;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;

    @Transactional
    public void createDefaultBoard(Project project) {
        Board board = boardRepository.save(new Board(project, "Bảng công việc", true));

        boardColumnRepository.saveAll(List.of(
                new BoardColumn(board, "Cần thực hiện", TaskStatus.TODO, 1),
                new BoardColumn(board, "Đang thực hiện", TaskStatus.IN_PROGRESS, 2),
                new BoardColumn(board, "Chờ kiểm tra", TaskStatus.IN_REVIEW, 3),
                new BoardColumn(board, "Hoàn thành", TaskStatus.DONE, 4)
        ));
    }

    @Transactional(readOnly = true)
    public BoardResponse findDefault(Long projectId) {
        Board board = boardRepository.findByProjectIdAndDefaultBoardTrue(projectId)
                .orElseThrow(() -> new NotFoundException("Dự án chưa có bảng công việc"));

        List<BoardColumnResponse> columns = boardColumnRepository.findByBoardIdOrderByPositionAsc(board.getId())
                .stream()
                .map(this::toColumnResponse)
                .toList();

        return new BoardResponse(board.getId(), board.getName(), columns);
    }

    @Transactional
    public BoardColumnResponse updateColumn(Long projectId, Long columnId, UpdateBoardColumnRequest request) {
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy cột bảng"));
        if (!column.getBoard().getProject().getId().equals(projectId)) {
            throw new NotFoundException("Không tìm thấy cột bảng");
        }
        column.configure(request.name().trim(), request.wipLimit());
        return toColumnResponse(column);
    }

    private BoardColumnResponse toColumnResponse(BoardColumn column) {
        return new BoardColumnResponse(
                column.getId(),
                column.getName(),
                column.getTaskStatus(),
                column.getPosition(),
                column.getWipLimit()
        );
    }
}
