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
    const provider = config?.provider || "openai";
    switch (provider) {
        case "openai": return config?.openaiApiKey ?? (config as any)?.apiKey ?? "";
        case "gemini": return config?.geminiApiKey ?? "";
        case "claude": return config?.claudeWorkspaceId ? `${config?.claudeApiKey}|${config?.claudeWorkspaceId}` : (config?.claudeApiKey ?? "");
        default: return (config as any)?.apiKey ?? "";
    }
}

export default function usePluginConfig() {
    const [rawConfig, setConfig] = useGlobalSyncedState<PluginConfig>(PluginConfigKey, DefaultConfig);

    const config: PluginConfig = {
        ...DefaultConfig,
        ...rawConfig,
        provider: rawConfig?.provider || "openai",
        openaiApiKey: rawConfig?.openaiApiKey ?? (rawConfig as any)?.apiKey ?? "",
        geminiApiKey: rawConfig?.geminiApiKey ?? "",
        claudeApiKey: rawConfig?.claudeApiKey ?? "",
        claudeWorkspaceId: rawConfig?.claudeWorkspaceId ?? "",
    };

    return {
        pluginConfig: {
            provider: config.provider,
            setProvider: (val: ProviderType) => setConfig(prev => ({ ...DefaultConfig, ...prev, provider: val })),
            apiKey: getApiKeyForProvider(config),
            setApiKey: (val: string) => {
                setConfig(prev => {
                    const current = { ...DefaultConfig, ...prev };
                    const provider = current.provider || "openai";
                    switch (provider) {
                        case "openai": return { ...current, openaiApiKey: val, apiKey: val };
                        case "gemini": return { ...current, geminiApiKey: val };
                        case "claude": return { ...current, claudeApiKey: val };
                        default: return { ...current, openaiApiKey: val, apiKey: val };
                    }
                })
            },
            claudeWorkspaceId: config.claudeWorkspaceId || "",
            setClaudeWorkspaceId: (val: string) => setConfig(prev => ({ ...DefaultConfig, ...prev, claudeWorkspaceId: val })),
            openaiApiKey: config.openaiApiKey,
            geminiApiKey: config.geminiApiKey,
            claudeApiKey: config.claudeApiKey,
            apiModel: config.apiModel,
            setApiModel: (val: string) => setConfig(prev => ({ ...DefaultConfig, ...prev, apiModel: val })),
            antiAntiTampering: config.antiAntiTampering,
            setAntiAntiTampering: (val: boolean) => setConfig(prev => ({ ...DefaultConfig, ...prev, antiAntiTampering: val })),
            btnVisibility: config.btnVisibility,
            setBtnVisibility: (val: AutoSolveButtonVisibility) => setConfig(prev => ({ ...DefaultConfig, ...prev, btnVisibility: val }))
        }
    }
}
