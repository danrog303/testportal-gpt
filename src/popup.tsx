import "style.css";

import { useState, useEffect } from "react";

import useAI from "~hooks/use-ai";
import usePluginConfig, { AutoSolveButtonVisibility } from "~hooks/use-plugin-config";
import useModels from "~hooks/use-models";
import ContextManager from "~components/ContextManager";
import { getLocale, t } from "~i18n";
import type { ProviderType } from "~providers/ai-provider";
import { getProvider } from "~providers/index";

const DONATION_LINKS = {
    buycoffee: "https://buycoffee.to/danielrogowski",
    kofi: "https://ko-fi.com/danrog303",
    paypal: "https://paypal.me/Daniel635"
};

const PROVIDER_OPTIONS: { value: ProviderType; label: string }[] = [
    { value: "openai", label: "OpenAI" },
    { value: "gemini", label: "Google Gemini" },
    { value: "claude", label: "Anthropic Claude" }
];

function getApiKeyLabel(provider: ProviderType): string {
    switch (provider) {
        case "openai": return t("apiKeyLabelOpenAI");
        case "gemini": return t("apiKeyLabelGemini");
        case "claude": return t("apiKeyLabelClaude");
    }
}

function getApiKeyPlaceholder(provider: ProviderType): string {
    switch (provider) {
        case "openai": return t("apiKeyPlaceholderOpenAI");
        case "gemini": return t("apiKeyPlaceholderGemini");
        case "claude": return t("apiKeyPlaceholderClaude");
    }
}

function IndexPopup() {
    const { pluginConfig } = usePluginConfig();
    const { requestAI } = useAI();
    const { models, isLoading: modelsLoading, error: modelsError } = useModels();
    const coffeeDonationLink = getLocale() === "pl"
        ? { href: DONATION_LINKS.buycoffee, label: "Buycoffee.to" }
        : { href: DONATION_LINKS.kofi, label: "Ko-fi" };

    const [keyValid, setKeyValid] = useState<boolean | null>(null);
    const [keyValidationInProgress, setKeyValidationInProgress] = useState<boolean>(false);
    const [keyValidationResponse, setKeyValidationResponse] = useState<string>("");

    useEffect(() => {
        if (models.length > 0) {
            const isCurrentModelValid = pluginConfig.apiModel && models.some(m => m.id === pluginConfig.apiModel);
            
            if (!isCurrentModelValid) {
                const providerInstance = getProvider(pluginConfig.provider);
                let defaultId = models[0].id;
                
                if (providerInstance.getDefaultModelId) {
                    const suggested = providerInstance.getDefaultModelId(models);
                    if (suggested) {
                        defaultId = suggested;
                    }
                }
                
                pluginConfig.setApiModel(defaultId);
            }
        }
    }, [models, pluginConfig.apiModel, pluginConfig.provider]);

    async function onTestApiKey() {
        let modelToUse = pluginConfig.apiModel;
        if (!modelToUse) {
            if (models.length > 0) {
                modelToUse = models[0].id;
                pluginConfig.setApiModel(modelToUse);
            } else {
                setKeyValid(false);
                setKeyValidationResponse(t("modelSetKeyFirst"));
                return;
            }
        }

        const prompt = "Respond with OK";
        setKeyValidationInProgress(true);
        try {
            const provider = getProvider(pluginConfig.provider);
            const response = await provider.requestAI({
                apiKey: pluginConfig.apiKey,
                model: modelToUse,
                prompt: prompt
            });
            setKeyValid(true);
            setKeyValidationResponse(response);
            setKeyValidationInProgress(false);
        } catch (error) {
            setKeyValid(false);
            setKeyValidationResponse(error instanceof Error ? error.message : error.toString());
            setKeyValidationInProgress(false);
        }
    }

    function handleProviderChange(newProvider: ProviderType) {
        pluginConfig.setProvider(newProvider);
        pluginConfig.setApiModel("");
        setKeyValid(null);
        setKeyValidationResponse("");
    }

    return <div className={"popup-container"}>
        <h1>{t("title")} <span className="popup-version">v{chrome.runtime.getManifest().version}</span></h1>
        <p>
            {t("welcome")}
        </p>
        <p className={"popup-buy-coffee-prompt"}>
            {t("supportPrompt")} <a href={coffeeDonationLink.href} target={"_blank"} rel={"noopener noreferrer"}>{coffeeDonationLink.label}</a> {t("supportPromptOr")} <a href={DONATION_LINKS.paypal} target={"_blank"} rel={"noopener noreferrer"}>PayPal</a>.
        </p>

        <br />

        <div>
            <label className={"popup-field-label"}>{t("providerLabel")}</label>
            <p>
                {t("providerDescription")}
            </p>
            <select defaultValue={pluginConfig.provider} onChange={e => handleProviderChange(e.target.value as ProviderType)}>
                {PROVIDER_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value} selected={pluginConfig.provider === opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>

        <hr />

        <div>
            <label className={"popup-field-label"}>{getApiKeyLabel(pluginConfig.provider)}</label>

            <p>
                {t("apiKeyDescription")}
            </p>

            <input type={"text"} defaultValue={pluginConfig.provider === "claude" ? pluginConfig.claudeApiKey : pluginConfig.provider === "gemini" ? pluginConfig.geminiApiKey : pluginConfig.openaiApiKey} onChange={e => pluginConfig.setApiKey(e.target.value)}
                placeholder={getApiKeyPlaceholder(pluginConfig.provider)} key={pluginConfig.provider + "-apikey"} />

            {pluginConfig.provider === "claude" && (
                <>
                    <label className={"popup-field-label"} style={{ marginTop: "16px" }}>{t("workspaceIdLabelClaude")}</label>
                    <p className={"popup-description"}>
                        {t("workspaceIdDescriptionClaude")}
                    </p>
                    <input type={"text"} defaultValue={pluginConfig.claudeWorkspaceId} onChange={e => pluginConfig.setClaudeWorkspaceId(e.target.value)}
                        placeholder={"wrkspc_..."} key={"claude-workspace-id"} />
                </>
            )}

            <button className={"popup-test-key-btn"} onClick={onTestApiKey} disabled={keyValidationInProgress || !pluginConfig.apiKey}>{t("testApiKey")}</button>

            {keyValidationInProgress && <p className={"popup-key-validation-in-progress"}>
                {t("validatingKey")}
            </p>}

            {keyValid === true && <p className={"popup-successful-key-validation"}>
                {t("keyValid")} {keyValidationResponse}.
            </p>}

            {keyValid === false && <p className={"popup-failed-key-validation"}>
                {t("keyInvalid")} {keyValidationResponse}.
            </p>}
        </div>

        <hr />

        <div>
            <label className={"popup-field-label"}>{t("modelLabel")}</label>
            <p>{t("modelDescription")}</p>
            {!pluginConfig.apiKey && (
                <p className="popup-model-hint">
                    <strong>{t("modelSetKeyFirst")}</strong>
                </p>
            )}
            {modelsLoading && <p className={"popup-model-hint"}>
                {t("modelLoading")}
            </p>}
            {modelsError && <p className={"popup-failed-key-validation"}>
                {t("modelError")} {modelsError}
            </p>}
            
            {pluginConfig.apiKey && !modelsError && (
                <select
                    id="modelSelect"
                    value={pluginConfig.apiModel}
                    onChange={e => pluginConfig.setApiModel(e.target.value)}
                    disabled={modelsLoading}
                >
                    {models.length === 0 && pluginConfig.apiModel && (
                        <option value={pluginConfig.apiModel}>{pluginConfig.apiModel}</option>
                    )}
                    {models.map((model) => {
                        const cleanId = model.id.startsWith("models/") ? model.id.substring(7) : model.id;
                        const isRedundant = model.displayName === cleanId || model.displayName === model.id;
                        const display = isRedundant ? model.displayName : `${model.displayName} (${cleanId})`;
                        return (
                            <option key={model.id} value={model.id}>
                                {display}
                            </option>
                        );
                    })}
                </select>
            )}
        </div>

        <hr />

        <div>
            <label className={"popup-field-label"}>{t("antiTamperingLabel")}</label>
            <p>
                {t("antiTamperingDescription")}
            </p>
            <label>
                <input type={"checkbox"}
                    checked={pluginConfig.antiAntiTampering}
                    onChange={e => pluginConfig.setAntiAntiTampering(e.target.checked)} />
                {t("enable")}
            </label>
        </div>

        {pluginConfig.apiKey && !modelsError && (
            <>
                <hr />
                <ContextManager />
            </>
        )}

        <hr />

        <div>
            <label className={"popup-field-label"}>{t("visibilityLabel")}</label>
            <p>
                {t("visibilityDescription")}
            </p>
            <select defaultValue={pluginConfig.btnVisibility}
                onChange={e => pluginConfig.setBtnVisibility(e.target.value as AutoSolveButtonVisibility)}>
                <option value={AutoSolveButtonVisibility.VISIBLE}
                    selected={pluginConfig.btnVisibility === AutoSolveButtonVisibility.VISIBLE}>
                    {t("visibilityVisible")}
                </option>

                <option value={AutoSolveButtonVisibility.BARELY_VISIBLE}
                    selected={pluginConfig.btnVisibility === AutoSolveButtonVisibility.BARELY_VISIBLE}>
                    {t("visibilityBarelyVisible")}
                </option>

                <option value={AutoSolveButtonVisibility.NOT_VISIBLE}
                    selected={pluginConfig.btnVisibility === AutoSolveButtonVisibility.NOT_VISIBLE}>
                    {t("visibilityInvisible")}
                </option>
            </select>
            {pluginConfig.btnVisibility === AutoSolveButtonVisibility.NOT_VISIBLE && <p className="popup-visibility-warning">
                {t("visibilityWarning")}
            </p>}
        </div>
    </div>;
}

export default IndexPopup
