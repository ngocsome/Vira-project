package vn.vira.team.application;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.project.application.ProjectService;
import vn.vira.project.domain.ProjectMemberRepository;
import vn.vira.shared.exception.*;
import vn.vira.team.api.*;
import vn.vira.team.domain.*;
import vn.vira.user.domain.UserRepository;
@Service @RequiredArgsConstructor public class TeamService {
 private final ProjectTeamRepository teams; private final ProjectService projects; private final ProjectMemberRepository members; private final UserRepository users;
 @Transactional(readOnly=true) public List<TeamResponse> find(Long projectId){projects.requireMember(projectId);return teams.findByProjectIdOrderByNameAsc(projectId).stream().map(this::map).toList();}
 @Transactional public TeamResponse create(Long projectId, TeamRequests.Save request){var project=projects.requireManager(projectId);if(teams.existsByProjectIdAndNameIgnoreCase(projectId,request.name().trim()))throw new BusinessException("Tên nhóm đã tồn tại");return map(teams.save(new ProjectTeam(project,request.name().trim(),blank(request.description()))));}
 @Transactional public TeamResponse update(Long projectId,Long teamId,TeamRequests.Save request){projects.requireManager(projectId);var team=require(projectId,teamId);team.setName(request.name().trim());team.setDescription(blank(request.description()));return map(team);}
 @Transactional public TeamResponse members(Long projectId,Long teamId,TeamRequests.Members request){projects.requireManager(projectId);var team=require(projectId,teamId);var ids=new LinkedHashSet<>(request.userIds());var selected=users.findAllById(ids);if(selected.size()!=ids.size()||selected.stream().anyMatch(u->!members.existsByProjectIdAndUserIdAndRemovedAtIsNull(projectId,u.getId())))throw new BusinessException("Mọi thành viên nhóm phải thuộc dự án");team.getMembers().clear();team.getMembers().addAll(selected);return map(team);}
 @Transactional public void delete(Long projectId,Long teamId){projects.requireManager(projectId);teams.delete(require(projectId,teamId));}
 private ProjectTeam require(Long p,Long id){return teams.findByIdAndProjectId(id,p).orElseThrow(()->new NotFoundException("Không tìm thấy nhóm"));}
 private TeamResponse map(ProjectTeam t){return new TeamResponse(t.getId(),t.getName(),t.getDescription(),t.getMembers().stream().map(u->new TeamResponse.Member(u.getId(),u.getFullName(),u.getEmail())).toList());}
 private String blank(String v){return v==null||v.isBlank()?null:v.trim();}
}
