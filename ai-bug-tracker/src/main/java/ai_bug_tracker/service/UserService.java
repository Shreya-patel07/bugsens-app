package ai_bug_tracker.service;

import ai_bug_tracker.entity.User;
import ai_bug_tracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Manual password encoder object
    private BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public User register(User user) {

        // Encrypt password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }

    public String login(String email, String password){

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if(passwordEncoder.matches(password, user.getPassword())){

            return "Login Successful";

        } else {

            throw new RuntimeException("Invalid Password");
        }
    }
}