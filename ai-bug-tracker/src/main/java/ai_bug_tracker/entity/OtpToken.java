package ai_bug_tracker.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // CHANGED: Renamed from email to identifier to accept phone numbers too
    private String identifier;
    private String tokenCode;
    private LocalDateTime expiryTime;
    private boolean used = false;

    public OtpToken(String identifier, String tokenCode, LocalDateTime expiryTime) {
        this.identifier = identifier;
        this.tokenCode = tokenCode;
        this.expiryTime = expiryTime;
    }
}