import useGlobalSyncedState from "~hooks/use-global-synced-state"
import { GptModel } from "~models/openai";

export enum PluginConfigKeys {
    OpenAIApiKey = "testportal-gpt-api-key",
    OpenAIModel = "testportal-gpt-api-model",
    TestPortalAntiAntiTampering = "testportal-gpt-anti-anti-tampering",
    AIAdditionalContext = "testportal-gpt-additional-context",
    AutoSolveButtonVisibility = "testportal-gpt-btn-visibilitiy"
}

export enum AutoSolveButtonVisibility {
    VISIBLE = "visible",
    BARELY_VISIBLE = "barely_visible",
    NOT_VISIBLE = "not_visible"
}

export default function usePluginConfig() {
    const [apiKey, setApiKey] = useGlobalSyncedState<string>(PluginConfigKeys.OpenAIApiKey, "");
    const [apiModel, setApiModel] = useGlobalSyncedState<string>(PluginConfigKeys.OpenAIModel, GptModel.GPT_3_5_TURBO);
    const [antiAntiTampering, setAntiAntiTampering] = useGlobalSyncedState<boolean>(PluginConfigKeys.TestPortalAntiAntiTampering, false);
    const [additionalContext, setAdditionalContext] = useGlobalSyncedState<string>(PluginConfigKeys.AIAdditionalContext, "");
    const [btnVisibility, setBtnVisibility] = useGlobalSyncedState(PluginConfigKeys.AutoSolveButtonVisibility, AutoSolveButtonVisibility.VISIBLE);

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
            btnVisibility,
            setBtnVisibility
        }
    }
}
