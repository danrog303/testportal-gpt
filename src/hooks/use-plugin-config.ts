import useGlobalSyncedState from "~hooks/use-global-synced-state"
import { GptModel } from "~models/openai";

export enum PluginConfigKeys {
    OpenAIApiKey = "testportal-gpt-api-key",
    OpenAIModel = "testportal-gpt-api-model",
    TestPortalAntiAntiTampering = "testportal-gpt-anti-anti-tampering",
    AutoSolveButtonVisibility = "testportal-gpt-btn-visibilitiy"
}

export enum AutoSolveButtonVisibility {
    VISIBLE = "visible",
    BARELY_VISIBLE = "barely_visible",
    NOT_VISIBLE = "not_visible"
}

export const PluginConfigKey = "testportal-gpt-config-v2";

export interface PluginConfig {
    apiKey: string;
    apiModel: string;
    antiAntiTampering: boolean;
    btnVisibility: AutoSolveButtonVisibility;
}

const DefaultConfig: PluginConfig = {
    apiKey: "",
    apiModel: GptModel.GPT_5_MINI,
    antiAntiTampering: false,
    btnVisibility: AutoSolveButtonVisibility.VISIBLE
}

export default function usePluginConfig() {
    const [config, setConfig] = useGlobalSyncedState<PluginConfig>(PluginConfigKey, DefaultConfig);

    return {
        pluginConfig: {
            apiKey: config.apiKey,
            setApiKey: (val: string) => setConfig(prev => ({ ...prev, apiKey: val })),
            apiModel: config.apiModel,
            setApiModel: (val: string) => setConfig(prev => ({ ...prev, apiModel: val })),
            antiAntiTampering: config.antiAntiTampering,
            setAntiAntiTampering: (val: boolean) => setConfig(prev => ({ ...prev, antiAntiTampering: val })),
            btnVisibility: config.btnVisibility,
            setBtnVisibility: (val: AutoSolveButtonVisibility) => setConfig(prev => ({ ...prev, btnVisibility: val }))
        }
    }
}
