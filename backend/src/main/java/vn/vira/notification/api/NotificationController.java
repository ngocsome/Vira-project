package vn.vira.notification.api;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.notification.application.NotificationService;
import vn.vira.shared.api.ApiResponse;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<List<NotificationResponse>> findMyNotifications() {
        return ApiResponse.ok(notificationService.findMyNotifications(), "Lấy thông báo thành công");
    }

    @PatchMapping("/{notificationId}/read")
    public ApiResponse<NotificationResponse> markRead(@PathVariable Long notificationId) {
        return ApiResponse.ok(
                notificationService.markRead(notificationId),
                "Đánh dấu đã đọc thành công"
        );
    }
}
