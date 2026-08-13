package ai_bug_tracker.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeepSeekService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;

    public DeepSeekService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    public String analyzeCode(String code) {
        String systemRules = """
                You are an expert AI Code Analyzer. Your job is to inspect the user's submitted program for syntax errors, logical bugs, or compilation issues.

                CRITICAL PROCESSING RULES:
                1. Do NOT include pleasantries or conversational filler like "Here is your analysis" or "Sure!". Get straight to the analysis.
                2. Format your output strictly in Markdown. Use ### for main headers.
                
                OUTPUT FORMAT:
                
                If the code has errors, start with:
                ### ERRORS IN YOUR CODE
                
                For each error found, provide a brief description and the specific line or keyword that is wrong. Use numbered lists. Use bold for emphasis (e.g., **Line 5**). Use inline code (`) for code snippets.
                
                Then provide the fully corrected code block:
                ### CORRECTED CODE
                ```java
                // fully corrected, clean, runnable code here
                ```
                
                If the code is perfectly correct and bug-free, start with:
                ### CODE ANALYSIS
                Briefly explain why the code is correct or suggest minor best-practice optimizations if applicable.
                """;

        String finalPrompt = systemRules + "\n\nAnalyze this code:\n" + code;

        Map<String, Object> part = new HashMap<>();
        part.put("text", finalPrompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));

        try {
            if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
                return "AI Error : Gemini API key is missing. Please configure GEMINI_API_KEY in Render environment variables.";
            }

            Map response = webClient.post()
                    .uri("/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidateContent = (Map<String, Object>) candidates.get(0).get("content");
                    if (candidateContent != null && candidateContent.containsKey("parts")) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) candidateContent.get("parts");
                        if (!parts.isEmpty()) {
                            return parts.get(0).get("text").toString();
                        }
                    }
                }
            }

            return "AI Error: AI processed the request but returned an empty response field.";

        } catch (Exception e) {
            e.printStackTrace();
            return "AI Connection Error : " + e.getMessage();
        }
    }
}