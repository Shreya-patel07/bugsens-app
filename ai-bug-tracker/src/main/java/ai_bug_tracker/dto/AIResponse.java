package ai_bug_tracker.dto;

public class AIResponse {

    private String result;

    public AIResponse() {
    }

    public AIResponse(String result) {
        this.result = result;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }
}