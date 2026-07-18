package ai_bug_tracker.ai;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class OllamaService {

    private final WebClient webClient;

    public OllamaService() {
        this.webClient = WebClient.builder()
                .baseUrl("http://localhost:11434")
                .build();
    } 

    public String analyzeCode(String code) {


        String prompt = """
You are a code debugging engine. Your output must strictly follow the schema below. 
Do not provide conversational filler, introductions, or explanations. 
If no error is found, return "No errors found".

Format:
❌ Errors:
[1]. [Error Description]
[2]. [Suggested Fix]

Output ONLY:
""" + code;

        Map<String, Object> requestBody = Map.of(
                "model", "deepseek-coder:latest",
                "prompt", prompt,
                "stream", false
        );

        try {

            Map response = webClient.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return response.get("response").toString();

        } catch (Exception e) {
            return "Ollama Error: " + e.getMessage();
        }
    }
}