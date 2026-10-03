package vn.vira.team.api;
import jakarta.validation.constraints.*;
import java.util.List;
public final class TeamRequests {
 private TeamRequests() {}
 public record Save(@NotBlank @Size(max=120) String name, @Size(max=500) String description) {}
 public record Members(@NotNull List<Long> userIds) {}
}
