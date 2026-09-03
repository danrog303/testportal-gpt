import useGlobalSyncedState from "~hooks/use-global-synced-state"
import type { ProviderType } from "~providers/ai-provider";

export enum PluginConfigKeys {
    OpenAIApiKey = "testportal-gpt-api-key",
    OpenAIModel = "testportal-gpt-api-model",
    TestportalAntiAntiTampering = "testportal-gpt-anti-anti-tampering",
    AutoSolveButtonVisibility = "testportal-gpt-btn-visibilitiy"
}

export enum AutoSolveButtonVisibility {
    VISIBLE = "visible",
    BARELY_VISIBLE = "barely_visible",
    NOT_VISIBLE = "not_visible"
}

export const PluginConfigKey = "testportal-gpt-config-v2";

export interface PluginConfig {
    provider: ProviderType;
    openaiApiKey: string;
    geminiApiKey: string;
    claudeApiKey: string;
    claudeWorkspaceId: string;
    apiModel: string;
    antiAntiTampering: boolean;
    btnVisibility: AutoSolveButtonVisibility;
}

const DefaultConfig: PluginConfig = {
    provider: "openai",
    openaiApiKey: "",
    geminiApiKey: "",
    claudeApiKey: "",
    claudeWorkspaceId: "",
    apiModel: "gpt-5.2",
    antiAntiTampering: true,
    btnVisibility: AutoSolveButtonVisibility.VISIBLE
}

function getApiKeyForProvider(config: PluginConfig): string {
    switch (config.provider) {
        case "openai": return config.openaiApiKey;
        case "gemini": return config.geminiApiKey;
        case "claude": return config.claudeWorkspaceId ? `${config.claudeApiKey}|${config.claudeWorkspaceId}` : config.claudeApiKey;
    }
}

export default function usePluginConfig() {
    const [config, setConfig] = useGlobalSyncedState<PluginConfig>(PluginConfigKey, DefaultConfig);

    return {
        pluginConfig: {
            provider: config.provider,
            setProvider: (val: ProviderType) => setConfig(prev => ({ ...prev, provider: val })),
            apiKey: getApiKeyForProvider(config),
            setApiKey: (val: string) => {
                setConfig(prev => {
                    switch (prev.provider) {
                        case "openai": return { ...prev, openaiApiKey: val };
                        case "gemini": return { ...prev, geminiApiKey: val };
                        case "claude": return { ...prev, claudeApiKey: val };
                    }
                })
            },
            claudeWorkspaceId: config.claudeWorkspaceId || "",
            setClaudeWorkspaceId: (val: string) => setConfig(prev => ({ ...prev, claudeWorkspaceId: val })),
            openaiApiKey: config.openaiApiKey,
            geminiApiKey: config.geminiApiKey,
            claudeApiKey: config.claudeApiKey,
            apiModel: config.apiModel,
            setApiModel: (val: string) => setConfig(prev => ({ ...prev, apiModel: val })),
            antiAntiTampering: config.antiAntiTampering,
            setAntiAntiTampering: (val: boolean) => setConfig(prev => ({ ...prev, antiAntiTampering: val })),
            btnVisibility: config.btnVisibility,
            setBtnVisibility: (val: AutoSolveButtonVisibility) => setConfig(prev => ({ ...prev, btnVisibility: val }))
        }
    }
}
