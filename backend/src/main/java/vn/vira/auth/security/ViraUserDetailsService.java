package vn.vira.auth.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import vn.vira.user.domain.User;
import vn.vira.user.domain.UserRepository;
import vn.vira.user.domain.UserStatus;

@Service
public class ViraUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public ViraUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String userId) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng"));

        return org.springframework.security.core.userdetails.User.withUsername(user.getId().toString())
                .password(user.getPasswordHash())
                .authorities("USER")
                .disabled(user.getStatus() != UserStatus.ACTIVE)
                .build();
    }
}
