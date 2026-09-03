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
    openaiModel: string;
    geminiModel: string;
    claudeModel: string;
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
    openaiModel: "gpt-5.2",
    geminiModel: "",
    claudeModel: "",
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

function getModelForProvider(config: PluginConfig): string {
    const provider = config?.provider || "openai";
    switch (provider) {
        case "openai": return config?.openaiModel || (config?.apiModel && !config.apiModel.includes("gemini") && !config.apiModel.includes("claude") ? config.apiModel : "gpt-5.2");
        case "gemini": return config?.geminiModel || (config?.apiModel && config.apiModel.includes("gemini") ? config.apiModel : "");
        case "claude": return config?.claudeModel || (config?.apiModel && config.apiModel.includes("claude") ? config.apiModel : "");
        default: return config?.apiModel || "";
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
        openaiModel: rawConfig?.openaiModel ?? (rawConfig?.provider === "openai" ? rawConfig?.apiModel : "") ?? "gpt-5.2",
        geminiModel: rawConfig?.geminiModel ?? (rawConfig?.provider === "gemini" ? rawConfig?.apiModel : "") ?? "",
        claudeModel: rawConfig?.claudeModel ?? (rawConfig?.provider === "claude" ? rawConfig?.apiModel : "") ?? "",
    };

    const activeModel = getModelForProvider(config);

    return {
        pluginConfig: {
            provider: config.provider,
            setProvider: (val: ProviderType) => setConfig(prev => {
                const current = { ...DefaultConfig, ...prev };
                let targetModel = "";
                if (val === "openai") targetModel = current.openaiModel || "gpt-5.2";
                else if (val === "gemini") targetModel = current.geminiModel || "";
                else if (val === "claude") targetModel = current.claudeModel || "";
                return {
                    ...current,
                    provider: val,
                    apiModel: targetModel
                };
            }),
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
            apiModel: activeModel,
            setApiModel: (val: string) => setConfig(prev => {
                const current = { ...DefaultConfig, ...prev };
                const provider = current.provider || "openai";
                if (provider === "openai") {
                    return { ...current, openaiModel: val, apiModel: val };
                } else if (provider === "gemini") {
                    return { ...current, geminiModel: val, apiModel: val };
                } else if (provider === "claude") {
                    return { ...current, claudeModel: val, apiModel: val };
                }
                return { ...current, apiModel: val };
            }),
            antiAntiTampering: config.antiAntiTampering,
            setAntiAntiTampering: (val: boolean) => setConfig(prev => ({ ...DefaultConfig, ...prev, antiAntiTampering: val })),
            btnVisibility: config.btnVisibility,
            setBtnVisibility: (val: AutoSolveButtonVisibility) => setConfig(prev => ({ ...DefaultConfig, ...prev, btnVisibility: val }))
        }
    }
}
