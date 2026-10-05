package vn.vira.team.api;
import java.util.List;
public record TeamResponse(Long id, String name, String description, List<Member> members) { public record Member(Long id, String fullName, String email) {} }
