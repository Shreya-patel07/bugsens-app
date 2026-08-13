package ai_bug_tracker.controller;

import ai_bug_tracker.ai.DeepSeekService;
import ai_bug_tracker.dto.AIResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
//@CrossOrigin(origins = "http://localhost:3000") // Allow your React app to connect
@CrossOrigin(origins = {"http://localhost:3000", "https://bugsens-app.vercel.app"})
public class AIController {

    @Autowired
    private DeepSeekService deepSeekService;

    @PostMapping("/analyze")
    public AIResponse analyze(@RequestBody Map<String, String> body) {
            String code = body.get("code");

        String result = deepSeekService.analyzeCode(code);

        return new AIResponse(result);
    }
}