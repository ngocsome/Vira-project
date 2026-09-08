package vn.vira.auth.application;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.vira.auth.api.ForgotPasswordRequest;
import vn.vira.auth.api.ResetPasswordRequest;
import vn.vira.auth.domain.PasswordResetToken;
import vn.vira.auth.domain.PasswordResetTokenRepository;
import vn.vira.shared.exception.BusinessException;
import vn.vira.user.domain.UserRepository;

@Service @RequiredArgsConstructor
public class PasswordResetService {
  private final UserRepository users; private final PasswordResetTokenRepository tokens; private final JavaMailSender mailSender;
  @Value("${app.mail.reset-url:http://localhost:5173/reset-password}") private String resetUrl;
  @Transactional public void request(ForgotPasswordRequest request) {
    users.findByEmailIgnoreCase(request.email().trim()).ifPresent(user -> { String raw=UUID.randomUUID().toString()+UUID.randomUUID(); tokens.save(new PasswordResetToken(user, hash(raw), Instant.now().plus(30, ChronoUnit.MINUTES))); SimpleMailMessage mail=new SimpleMailMessage(); mail.setTo(user.getEmail()); mail.setSubject("Đặt lại mật khẩu Vira"); mail.setText("Yêu cầu đặt lại mật khẩu của bạn: " + resetUrl + "?token=" + raw + "\nLiên kết có hiệu lực 30 phút."); mailSender.send(mail); });
  }
  @Transactional public void reset(ResetPasswordRequest request) { PasswordResetToken token=tokens.findByTokenHash(hash(request.token())).filter(item->item.isUsable(Instant.now())).orElseThrow(()->new BusinessException("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn")); token.getUser().setPasswordHash(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(request.newPassword())); token.use(); }
  private String hash(String value) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch (Exception e) { throw new IllegalStateException(e); } }
}
