import "style.css";

import { useState } from "react";

import useOpenAI from "~hooks/use-openai";
import usePluginConfig, { AutoSolveButtonVisibility } from "~hooks/use-plugin-config";
import { GptModel } from "~models/openai";

function IndexPopup() {
    const { pluginConfig } = usePluginConfig();
    const { requestAI } = useOpenAI();

    const [ keyValid, setKeyValid ] = useState<boolean | null>(null);
    const [ keyValidationInProgress, setKeyValidationInProgress ] = useState<boolean>(false);
    const [ keyValidationResponse, setKeyValidationResponse ] = useState<string>("");

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
        <h1>TestPortal GPT</h1>
        <p>
            Welcome to TestPortal GPT.
            When you enter any TestPortal test, you should see "Auto-solve" button at the bottom of the question.
            Click it to let the plugin generate an answer for you.
        </p>
        <p className={"popup-buy-coffee-prompt"}>
            If you like the extension, please consider supporting me by buying me a virtual coffee at <a href={"https://buycoffee.to/danielrogowski"} target={"_blank"} rel={"noopener noreferrer"}>Buycoffee.to</a>.
        </p>

        <br />

        <div>
            <label className={"popup-field-label"}>OpenAI API key:</label>

            <p>
                TestportalGPT requires your own API key in order to work.
                You can get one from OpenAI website.
                You can test the key using the button below (please note that it will trigger an API request, for which
                you will be charged).
            </p>

            <input type={"text"} defaultValue={pluginConfig.apiKey} onChange={e => pluginConfig.setApiKey(e.target.value)}
                   placeholder={"sk-..."} />
            <button className={"popup-test-key-btn"} onClick={onTestApiKey}>Test API key</button>

            {keyValidationInProgress && <p className={"popup-key-validation-in-progress"}>
                Please wait, API key validation in progress...
            </p>}

            {keyValid === true && <p className={"popup-successful-key-validation"}>
                API key is valid! Response: {keyValidationResponse}.
            </p>}

            {keyValid === false && <p className={"popup-failed-key-validation"}>
              API key is invalid... Response: {keyValidationResponse}.
            </p>}
        </div>

        <hr />

        <div>
            <label className={"popup-field-label"}>OpenAI API model:</label>
            <p>
                Choose the model you want to use for generating answers.
                Please note that the model you choose will affect the quality of the answers and the cost of the API requests.
            </p>
            <select defaultValue={pluginConfig.apiModel} onChange={e => pluginConfig.setApiModel(e.target.value)}>
                {Object.values(GptModel).map((model) => (
                    <option key={model} value={model} selected={pluginConfig.apiModel === model}>
                        {model}
                    </option>
                ))}
            </select>
        </div>

        <hr/>

        <div>
            <label className={"popup-field-label"}>Anti-anti-tampering:</label>
            <p>
                Testportal has a mechanism that detects when you leave the page.
                When you enable this option, the plugin will try to prevent this feature from working.
            </p>
            <label>
                <input type={"checkbox"}
                       checked={pluginConfig.antiAntiTampering}
                       onChange={e => pluginConfig.setAntiAntiTampering(e.target.checked)} />
                Enable
            </label>
        </div>

        <hr/>

        <div>
            <label className={"popup-field-label"}>Additional context:</label>
            <p>
                Add here any additional context that you want to be included in the prompt sent to OpenAI API.
                This can be useful for providing more information about the test or the subject.
            </p>
            <textarea defaultValue={pluginConfig.additionalContext}
                      onChange={e => pluginConfig.setAdditionalContext(e.target.value)}>
            </textarea>
        </div>

        <hr/>

        <div>
            <label className={"popup-field-label"}>Auto-solve button visibility:</label>
            <p>
                When set to "Barely visible", auto-solve button will be given 95% transparency so that it does not
                attract attention. You can also hide the button completely by setting this option to "Invisible".
            </p>
            <select defaultValue={pluginConfig.btnVisibility}
                    onChange={e => pluginConfig.setBtnVisibility(e.target.value as AutoSolveButtonVisibility)}>
                <option value={AutoSolveButtonVisibility.VISIBLE}
                        selected={pluginConfig.btnVisibility === AutoSolveButtonVisibility.VISIBLE}>
                    Visible
                </option>

                <option value={AutoSolveButtonVisibility.BARELY_VISIBLE}
                        selected={pluginConfig.btnVisibility === AutoSolveButtonVisibility.BARELY_VISIBLE}>
                    Barely visible
                </option>

                <option value={AutoSolveButtonVisibility.NOT_VISIBLE}
                        selected={pluginConfig.btnVisibility === AutoSolveButtonVisibility.NOT_VISIBLE}>
                    Invisible
                </option>
            </select>
            {pluginConfig.btnVisibility === AutoSolveButtonVisibility.NOT_VISIBLE && <p className="popup-visibility-warning">
                Warning: Now auto-solve button will be completely invisible! You can still click it, but it won't be visible.
                If you don't know where the button normally is, it is recommended to switch this option to
                "Barely visible" or "visible".
            </p>}
        </div>
    </div>;
}

export default IndexPopup
