package ai_bug_tracker.dto;

//Create an this class to catch the 6-digit data grid package when submitted by user.

public class OtpVerificationRequest {
    private String email;
    private String token;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
