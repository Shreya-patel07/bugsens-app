package ai_bug_tracker.repository;

import ai_bug_tracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

// It is used to communicate with the database

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

}
