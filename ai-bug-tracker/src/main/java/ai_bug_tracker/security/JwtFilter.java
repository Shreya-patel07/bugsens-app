package ai_bug_tracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getServletPath();

        if (path.startsWith("/api/auth") ||
                path.startsWith("/api/ai") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/swagger-ui")) {

            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if(authHeader != null && authHeader.startsWith("Bearer ")){

            String token = authHeader.substring(7);

            try{
                String email = jwtUtil.extractEmail(token);

                System.out.println("Valid Token for: " + email);

            } catch (Exception e){

                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid Token");

                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}