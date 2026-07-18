package ai_bug_tracker.repository;

import ai_bug_tracker.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken ,Long> {

    // Fetches the absolute latest OTP sent to a specific user using either email OR phone number
    Optional<OtpToken>findFirstByIdentifierOrderByIdDesc(String identifier);



}
