package ai_bug_tracker.security;

import ai_bug_tracker.entity.User;
import ai_bug_tracker.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        
        // Handle cases where GitHub might not return an email directly
        if(email == null) {
            String login = oAuth2User.getAttribute("login");
            email = login != null ? login + "@github.com" : "unknown@bugsens.dev";
        }
        
        if(name == null) {
            name = oAuth2User.getAttribute("login");
            if (name == null) name = "User";
        }

        // Must be effectively final for lambda
        final String finalEmail = email;
        final String finalName = name;

        User user = userRepository.findByEmail(finalEmail).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(finalEmail);
            newUser.setName(finalName);
            newUser.setRole("USER");
            newUser.setPassword(""); // OAuth2 users don't need a password for this application
            return userRepository.save(newUser);
        });

        String jwtToken = jwtUtil.generateToken(user.getEmail());

        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/")
                .queryParam("token", jwtToken)
                .queryParam("email", user.getEmail())
                .build().toUriString();

        response.sendRedirect(targetUrl);
    }
}
