package vn.vira.workspace.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    @Query("""
            select w from Workspace w
            join WorkspaceMember member on member.workspace.id = w.id
            where member.user.id = :userId and w.archivedAt is null
            order by w.updatedAt desc
            """)
    List<Workspace> findActiveByMemberId(Long userId);

    @Query("select w from Workspace w join WorkspaceMember member on member.workspace.id = w.id where member.user.id = :userId and w.archivedAt is not null order by w.updatedAt desc")
    List<Workspace> findArchivedByMemberId(Long userId);
}
