package ai_bug_tracker.controller;

import ai_bug_tracker.dto.LoginRequest;
import ai_bug_tracker.dto.OtpVerificationRequest;
import ai_bug_tracker.entity.User;
import ai_bug_tracker.entity.OtpToken;
import ai_bug_tracker.repository.OtpTokenRepository;
import ai_bug_tracker.service.UserService;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "https://bugsens-app.vercel.app"})
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    // 🌟 ADDED: Inject Spring Boot's built-in mail dispatcher engine
    @Autowired
    private JavaMailSender mailSender;

    // 🌟 ADDED: Read your authenticated system email sender from application.properties
    @Value("${spring.mail.username}")
    private String fromEmail;

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        return userService.register(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String loginResult = userService.login(request.getEmail(), request.getPassword());

        if (loginResult == null || loginResult.toLowerCase().contains("fail") || loginResult.toLowerCase().contains("invalid")) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid email/phone or password credentials.");
            return ResponseEntity.status(401).body(errorResponse);
        }

        String identifier = request.getEmail().trim();

        Random random = new Random();
        String generatedOtp = String.format("%06d", random.nextInt(1000000));

        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
        OtpToken tokenRecord = new OtpToken(identifier, generatedOtp, expiry);
        otpTokenRepository.save(tokenRecord);

        System.out.println("[OTP SYSTEM LOG] Generated token " + generatedOtp + " for identity target: " + identifier);

        // 🌟 ADDED: Dispatch a beautiful custom email directly to the dynamic recipient address
        try {
            sendOtpEmail(identifier, generatedOtp);
        } catch (Exception e) {
            System.err.println("[MAIL ERROR] Failed to dispatch email to " + identifier + ": " + e.getMessage());
            // We still return OK so your local dev process doesn't break if your internet is offline
        }

        Map<String, String> successResponse = new HashMap<>();
        successResponse.put("status", "OTP_SENT");
        successResponse.put("message", "Please check your channel and enter the 6 digit confirmation sequence.");
        return ResponseEntity.ok(successResponse);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerificationRequest request) {
        Map<String, String> response = new HashMap<>();

        String identifier = request.getEmail().trim();
        String codeEntered = request.getToken().trim();

        var tokenCheck = otpTokenRepository.findFirstByIdentifierOrderByIdDesc(identifier);

        if (tokenCheck.isEmpty()) {
            response.put("error", "No verification workflow session initiated for this user profile.");
            return ResponseEntity.status(400).body(response);
        }

        OtpToken activeLog = tokenCheck.get();

        if (activeLog.isUsed()) {
            response.put("error", "This validation token sequence has already been claimed.");
            return ResponseEntity.status(400).body(response);
        }

        if (LocalDateTime.now().isAfter(activeLog.getExpiryTime())) {
            response.put("error", "The lifespan lease validation context window has expired.");
            return ResponseEntity.status(400).body(response);
        }

        if (!activeLog.getTokenCode().equals(codeEntered)) {
            response.put("error", "Token security code mismatch verification failure.");
            return ResponseEntity.status(400).body(response);
        }

        activeLog.setUsed(true);
        otpTokenRepository.save(activeLog);

        response.put("status", "SUCCESS");
        response.put("message", "MFA Handshake Complete. Welcome to dashboard.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestParam String email) {
        Map<String, String> response = new HashMap<>();
        String identifier = email.trim();

        try {
            Random random = new Random();
            String generatedOtp = String.format("%06d", random.nextInt(1000000));

            LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);
            OtpToken tokenRecord = new OtpToken(identifier, generatedOtp, expiry);
            otpTokenRepository.save(tokenRecord);

            System.out.println("[OTP SYSTEM LOG] Resent newly generated token " + generatedOtp + " for identity target: " + identifier);

            // 🌟 ADDED: Dispatch email for the resend request route
            sendOtpEmail(identifier, generatedOtp);

            response.put("status", "OTP_SENT");
            response.put("message", "A new confirmation sequence has been dispatched.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("error", "Failed to process token allocation.");
            return ResponseEntity.status(500).body(response);
        }
    }

    // 🌟 NEW HELPER METHOD: Generates a premium dark HTML layout matching Bugsens styling
    private void sendOtpEmail(String recipientEmail, String otpCode) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(recipientEmail); // Sends to whichever dynamic email address was used to sign in
        helper.setSubject("Verify your Bugsens workspace context");

        String htmlTemplate = """
            <div style="background-color: #0a0a0a; color: #ffffff; padding: 44px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; border-radius: 16px; max-width: 460px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.03);">
              <div style="margin-bottom: 32px; font-weight: bold; font-size: 20px; letter-spacing: -0.5px;">
                Bugsens<span style="color: #a3e635;">.</span>
              </div>
              <h2 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0 0 8px 0; tracking: -0.5px;">Check your inbox.</h2>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0 0 28px 0;">Use the temporary security verification sequence below to finalize entry into your active telemetry dashboard.</p>
              
              <div style="background-color: #141414; border: 1px solid #27272a; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 28px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #a3e635; font-family: monospace; padding-left: 8px;">%s</span>
              </div>
              
              <p style="color: #52525b; font-size: 11px; margin: 0; border-top: 1px solid #1f1f23; pt-16px; padding-top: 16px;">This transaction sequence expires in exactly 5 minutes. If you did not trigger this request context, please change your root credentials immediately.</p>
            </div>
            """.formatted(otpCode);

        helper.setText(htmlTemplate, true);
        mailSender.send(message);
        System.out.println("[MAIL SERVICE] Dispatched email payload successfully to destination: " + recipientEmail);
    }
}