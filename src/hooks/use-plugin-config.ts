import useGlobalSyncedState from "~hooks/use-global-synced-state"
import { GptModel } from "~models/openai";

export enum PluginConfigKeys {
    OpenAIApiKey = "testportal-gpt-api-key",
    OpenAIModel = "testportal-gpt-api-model",
    TestPortalAntiAntiTampering = "testportal-gpt-anti-anti-tampering",
    AIAdditionalContext = "testportal-gpt-additional-context",
    StealthMode = "testportal-gpt-stealth-mode"
}

export default function usePluginConfig() {
    const [apiKey, setApiKey] = useGlobalSyncedState<string>(PluginConfigKeys.OpenAIApiKey, "");
    const [apiModel, setApiModel] = useGlobalSyncedState<string>(PluginConfigKeys.OpenAIModel, GptModel.GPT_3_5_TURBO);
    const [antiAntiTampering, setAntiAntiTampering] = useGlobalSyncedState<boolean>(PluginConfigKeys.TestPortalAntiAntiTampering, false);
    const [additionalContext, setAdditionalContext] = useGlobalSyncedState<string>(PluginConfigKeys.AIAdditionalContext, "");
    const [stealthMode, setStealthMode] = useGlobalSyncedState(PluginConfigKeys.StealthMode, false);

    return {
        pluginConfig: {
            apiKey,
            setApiKey,
            apiModel,
            setApiModel,
            antiAntiTampering,
            setAntiAntiTampering,
            additionalContext,
            setAdditionalContext,
            stealthMode,
            setStealthMode
        }
    }
}
