package ai_bug_tracker.ai;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;

@Service
public class DeepSeekService {

    private final WebClient webClient;

    public DeepSeekService() {
        this.webClient = WebClient.builder()
                .baseUrl("http://localhost:11434")
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

        // Combine the custom instructions and user code cleanly into a single prompt for Ollama
        String finalOllamaPrompt = systemRules + "\n\nAnalyze this code:\n" + code;

        // 1. Using a dynamic HashMap for the options to ensure clean JSON serialization
        Map<String, Object> options = new HashMap<>();
        options.put("temperature", 0.0);

        // 2. Build the main request body matching native Ollama specifications
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "deepseek-coder:latest"); // Standardizing to the latest build tag
        requestBody.put("prompt", finalOllamaPrompt);       // Combined instruction set goes here
        requestBody.put("stream", false);
        requestBody.put("options", options);

        try {
            // 3. Post to the native generation endpoint
            Map response = webClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            // 4. Safely check and extract the response
            if (response != null && response.get("response") != null) {
                return response.get("response").toString();
            }

            return "Local AI Error: Ollama processed the request but returned an empty response field.";

        } catch (Exception e) {
            e.printStackTrace();
            return "Local AI Error : " + e.getMessage();
        }
    }
}