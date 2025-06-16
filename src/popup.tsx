import "style.css";
import { useState } from "react";
import usePluginConfig from "~hooks/use-plugin-config";
import useOpenAI from "~hooks/use-openai"
import { GptModel } from "~models/openai";


function IndexPopup() {
    const { pluginConfig } = usePluginConfig();
    const { requestAI } = useOpenAI();

    const [ keyValid, setKeyValid ] = useState<boolean | null>(null);
    const [ keyValidationResponse, setKeyValidationResponse ] = useState<string>("");

    async function onTestApiKey() {
        const prompt = "Respond with OK";
        try {
            const response = await requestAI(prompt);
            setKeyValid(true);
            setKeyValidationResponse(response);
        } catch (error) {
            setKeyValid(false);
            setKeyValidationResponse(error instanceof Error ? error.message : error.toString());
        }
    }

    return <div className={"popup-container"}>
        <h1>Welcome to TestPortalGPT!</h1>
        <p>
            Welcome to the plugin made by Daniel Rogowski.
            When you enter any Testportal test, you should see "Autosolve" button at the bottom of the question.
            Click it to let the plugin generate an answer for you.
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
            <label className={"popup-field-label"}>Stealth mode:</label>
            <p>
                When enabled, the "Autosolve" button will be barely visible so that it does not attract attention.
            </p>
            <label>
                <input type={"checkbox"}
                       checked={pluginConfig.stealthMode}
                       onChange={e => pluginConfig.setStealthMode(e.target.checked)} />
                Enable
            </label>
        </div>
    </div>;
}

export default IndexPopup
