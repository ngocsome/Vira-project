package vn.vira.notification.application;

import java.time.*;
import java.util.LinkedHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.notification.domain.NotificationRepository;
import vn.vira.task.domain.*;
import vn.vira.user.domain.User;
import vn.vira.sprint.domain.*;

@Component @RequiredArgsConstructor
public class DeadlineReminderJob {
 private final TaskRepository tasks; private final NotificationRepository notifications;
 private final SprintRepository sprints;
 @Scheduled(cron = "${app.notifications.deadline-cron:0 0 9 * * *}", zone = "${app.notifications.time-zone:Asia/Ho_Chi_Minh}") @Transactional
 public void send() {
  LocalDate today=LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
  notify(tasks.findByDueDateBetweenAndStatusNotAndDeletedAtIsNull(today.minusDays(30),today.minusDays(1),TaskStatus.DONE),"TASK_OVERDUE","Công việc đã quá hạn","đã quá hạn");
  notify(tasks.findByDueDateBetweenAndStatusNotAndDeletedAtIsNull(today,today.plusDays(1),TaskStatus.DONE),"TASK_DUE_SOON","Công việc sắp đến hạn","đến hạn trong 24 giờ");
  for(Sprint sprint:sprints.findByStatusAndEndDateBetween(SprintStatus.ACTIVE,today,today.plusDays(1))){String url="/projects/"+sprint.getProject().getId()+"/sprints";Instant since=Instant.now().minus(Duration.ofHours(20));if(!notifications.existsByUserIdAndTypeAndTargetUrlAndCreatedAtAfter(sprint.getProject().getOwner().getId(),"SPRINT_ENDING",url,since))notifications.save(new vn.vira.notification.domain.Notification(sprint.getProject().getOwner(),"SPRINT_ENDING","Sprint sắp kết thúc",sprint.getName()+" kết thúc trong 24 giờ",url));}
 }
 private void notify(java.util.List<Task> items,String type,String title,String wording){
  Instant since=Instant.now().minus(Duration.ofHours(20));
  for(Task task:items){var recipients=new LinkedHashMap<Long,User>();task.getAssignees().forEach(u->recipients.put(u.getId(),u));task.getWatchers().forEach(u->recipients.put(u.getId(),u));String url="/projects/"+task.getProject().getId()+"/tasks/"+task.getId();for(User user:recipients.values())if(!notifications.existsByUserIdAndTypeAndTargetUrlAndCreatedAtAfter(user.getId(),type,url,since))notifications.save(new vn.vira.notification.domain.Notification(user,type,title,task.getTaskCode()+" "+wording,url));}
 }
}
