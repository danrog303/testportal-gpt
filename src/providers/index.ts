import type { AIProvider, ProviderType } from "~providers/ai-provider";
import { openaiProvider } from "~providers/openai-provider";
import { geminiProvider } from "~providers/gemini-provider";
import { claudeProvider } from "~providers/claude-provider";

export function getProvider(type: ProviderType): AIProvider {
    switch (type) {
        case "openai": return openaiProvider;
        case "gemini": return geminiProvider;
        case "claude": return claudeProvider;
    }
}
