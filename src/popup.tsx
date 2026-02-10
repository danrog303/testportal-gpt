import "style.css";

import { useState } from "react";

import useOpenAI from "~hooks/use-openai";
import usePluginConfig, { AutoSolveButtonVisibility } from "~hooks/use-plugin-config";
import { GptModel } from "~models/openai";
import ContextManager from "~components/ContextManager";
import { t } from "~i18n";

function IndexPopup() {
    const { pluginConfig } = usePluginConfig();
    const { requestAI } = useOpenAI();

    const [keyValid, setKeyValid] = useState<boolean | null>(null);
    const [keyValidationInProgress, setKeyValidationInProgress] = useState<boolean>(false);
    const [keyValidationResponse, setKeyValidationResponse] = useState<string>("");

    async function onTestApiKey() {
        const prompt = "Respond with OK";
        setKeyValidationInProgress(true);
        try {
            const response = await requestAI(prompt);
            setKeyValid(true);
            setKeyValidationResponse(response);
            setKeyValidationInProgress(false);
        } catch (error) {
            setKeyValid(false);
            setKeyValidationResponse(error instanceof Error ? error.message : error.toString());
            setKeyValidationInProgress(false);
        }
    }

    return <div className={"popup-container"}>
        <h1>{t("title")} <span className="popup-version">v{chrome.runtime.getManifest().version}</span></h1>
        <p>
            {t("welcome")}
        </p>
        <p className={"popup-buy-coffee-prompt"}>
            {t("supportPrompt")} <a href={"https://buycoffee.to/danielrogowski"} target={"_blank"} rel={"noopener noreferrer"}>Buycoffee.to</a>.
        </p>

        <br />

        <div>
            <label className={"popup-field-label"}>{t("apiKeyLabel")}</label>

            <p>
                {t("apiKeyDescription")}
            </p>

            <input type={"text"} defaultValue={pluginConfig.apiKey} onChange={e => pluginConfig.setApiKey(e.target.value)}
                placeholder={t("apiKeyPlaceholder")} />
            <button className={"popup-test-key-btn"} onClick={onTestApiKey}>{t("testApiKey")}</button>

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
            <p>
                {t("modelDescription")}
            </p>
            <select defaultValue={pluginConfig.apiModel} onChange={e => pluginConfig.setApiModel(e.target.value)}>
                {Object.values(GptModel).map((model) => (
                    <option key={model} value={model} selected={pluginConfig.apiModel === model}>
                        {model}
                    </option>
                ))}
            </select>
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

        <hr />

        <ContextManager />

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
