package ai_bug_tracker.service;

import org.springframework.stereotype.Service;

@Service
public class AIService {

    public String analyzeCode(String code) {

        return "AI Analysis Result: " + code;
    }
}