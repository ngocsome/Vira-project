package vn.vira.board.application;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.board.api.BoardColumnResponse;
import vn.vira.board.api.BoardResponse;
import vn.vira.board.api.UpdateBoardColumnRequest;
import vn.vira.board.api.CreateBoardColumnRequest;
import vn.vira.board.api.ReorderBoardColumnsRequest;
import vn.vira.board.domain.Board;
import vn.vira.board.domain.BoardColumn;
import vn.vira.board.domain.BoardColumnRepository;
import vn.vira.board.domain.BoardRepository;
import vn.vira.project.domain.Project;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.exception.BusinessException;
import vn.vira.task.domain.TaskStatus;
import vn.vira.task.domain.TaskRepository;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final TaskRepository taskRepository;

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

    @Transactional
    public BoardColumnResponse createColumn(Long projectId, CreateBoardColumnRequest request) {
        Board board = boardRepository.findByProjectIdAndDefaultBoardTrue(projectId)
                .orElseThrow(() -> new NotFoundException("Dự án chưa có bảng công việc"));
        if (boardColumnRepository.existsByBoardIdAndTaskStatus(board.getId(), request.taskStatus())) {
            throw new BusinessException("Trạng thái này đã có cột trên bảng");
        }
        int position = boardColumnRepository.findByBoardIdOrderByPositionAsc(board.getId()).size() + 1;
        BoardColumn column = boardColumnRepository.save(new BoardColumn(board, request.name().trim(), request.taskStatus(), position));
        column.configure(request.name().trim(), request.wipLimit());
        return toColumnResponse(column);
    }

    @Transactional
    public void reorderColumns(Long projectId, ReorderBoardColumnsRequest request) {
        Board board = boardRepository.findByProjectIdAndDefaultBoardTrue(projectId)
                .orElseThrow(() -> new NotFoundException("Dự án chưa có bảng công việc"));
        List<BoardColumn> columns = boardColumnRepository.findByBoardIdOrderByPositionAsc(board.getId());
        if (columns.size() != request.columnIds().size() || !columns.stream().map(BoardColumn::getId).collect(java.util.stream.Collectors.toSet()).equals(new java.util.HashSet<>(request.columnIds()))) {
            throw new BusinessException("Danh sách cột không hợp lệ");
        }
        java.util.Map<Long, BoardColumn> byId = columns.stream().collect(java.util.stream.Collectors.toMap(BoardColumn::getId, c -> c));
        for (int index = 0; index < request.columnIds().size(); index++) byId.get(request.columnIds().get(index)).setPosition(-(index + 1));
        boardColumnRepository.saveAll(columns);
        boardColumnRepository.flush();
        for (int index = 0; index < request.columnIds().size(); index++) byId.get(request.columnIds().get(index)).setPosition(index + 1);
    }

    @Transactional
    public void deleteColumn(Long projectId, Long columnId) {
        BoardColumn column = requireColumn(projectId, columnId);
        long tasks = taskRepository.countByProjectIdAndStatusAndDeletedAtIsNull(projectId, column.getTaskStatus());
        if (tasks != 0) throw new BusinessException("Không thể xóa cột đang có công việc");
        boardColumnRepository.delete(column);
        List<BoardColumn> remaining = boardColumnRepository.findByBoardIdOrderByPositionAsc(column.getBoard().getId());
        for (int index = 0; index < remaining.size(); index++) remaining.get(index).setPosition(index + 1);
    }

    private BoardColumn requireColumn(Long projectId, Long columnId) {
        BoardColumn column = boardColumnRepository.findById(columnId).orElseThrow(() -> new NotFoundException("Không tìm thấy cột bảng"));
        if (!column.getBoard().getProject().getId().equals(projectId)) throw new NotFoundException("Không tìm thấy cột bảng");
        return column;
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
