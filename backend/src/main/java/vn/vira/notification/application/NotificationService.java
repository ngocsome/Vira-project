package vn.vira.notification.application;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.notification.api.NotificationResponse;
import vn.vira.notification.domain.Notification;
import vn.vira.notification.domain.NotificationRepository;
import vn.vira.shared.exception.NotFoundException;
import vn.vira.shared.security.CurrentUser;
import vn.vira.user.domain.User;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<NotificationResponse> findMyNotifications() {
        return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(currentUser.id())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NotificationResponse markRead(Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, currentUser.id())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông báo"));

        notification.markRead();
        return toResponse(notification);
    }

    @Transactional
    public void create(User user, String type, String title, String body, String targetUrl) {
        notificationRepository.save(new Notification(user, type, title, body, targetUrl));
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getBody(),
                notification.getTargetUrl(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}
