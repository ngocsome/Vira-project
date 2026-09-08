package vn.vira.auth.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.security.jwt")
public class JwtProperties {

    private String issuer;
    private long accessTokenMinutes;
    private long refreshTokenDays;
    private String secret;
}
