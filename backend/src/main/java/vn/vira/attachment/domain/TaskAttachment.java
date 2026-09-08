package vn.vira.attachment.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import vn.vira.shared.persistence.BaseEntity;
import vn.vira.task.domain.Task;
import vn.vira.user.domain.User;

@Getter
@Entity
@Table(name = "task_attachments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TaskAttachment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;

    private String originalName;
    private String storedName;
    private String contentType;
    private long fileSize;

    public TaskAttachment(Task task, User uploader, String originalName, String storedName, String contentType, long fileSize) {
        this.task = task;
        this.uploader = uploader;
        this.originalName = originalName;
        this.storedName = storedName;
        this.contentType = contentType;
        this.fileSize = fileSize;
    }
}
