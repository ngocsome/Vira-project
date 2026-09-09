package vn.vira.task.application;
import java.util.LinkedHashMap;
import org.springframework.stereotype.Service;
import vn.vira.notification.application.NotificationService;
import vn.vira.shared.security.CurrentUser;
import vn.vira.task.domain.Task;
import vn.vira.user.domain.User;
@Service
public class TaskNotificationService {
 private final NotificationService notifications; private final CurrentUser currentUser;
 public TaskNotificationService(NotificationService notifications, CurrentUser currentUser) { this.notifications=notifications; this.currentUser=currentUser; }
 public void notifyParticipants(Task task,String type,String title,String body) {
  var recipients=new LinkedHashMap<Long,User>();
  task.getAssignees().forEach(user->recipients.put(user.getId(),user));
  task.getWatchers().forEach(user->recipients.put(user.getId(),user));
  recipients.values().stream().filter(user->!user.getId().equals(currentUser.id())).forEach(user->notifications.create(user,type,title,body,"/projects/"+task.getProject().getId()+"/tasks/"+task.getId()));
 }
}
