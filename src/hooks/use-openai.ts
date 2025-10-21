import usePluginConfig from "~hooks/use-plugin-config";

function useOpenAI() {
    const { pluginConfig } = usePluginConfig();

    async function requestAI(prompt: string, imageAttachment: string | undefined = undefined): Promise<string> {
        if (!pluginConfig.apiKey) {
            throw new Error("API key is not set in TestportalGPT plugin configuration.");
        }

        const apiMessages: any = [{ "type": "text", "text": prompt }];
        if (imageAttachment) {
            apiMessages.push({ "type": "image_url", "image_url": { "url": imageAttachment } });
        }

        let response: Response;
        try {
            response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pluginConfig.apiKey}`,
                },
                body: JSON.stringify({
                    model: pluginConfig.apiModel,
                    messages: [{ role: "user", content: apiMessages}]
                })
            });
        } catch (error) {
            throw new Error(`Failed to fetch from OpenAI API: ${error.message}`);
        }

        const responseJson = await response.json();

        if (responseJson.error) {
            if (responseJson.error.message.includes("Invalid image URL")) {
                throw new Error("Model could not process the image. " +
                    "Make sure you've chosen a model that supports images, like gpt-4o. " +
                    "Simple text models like gpt-3.5-turbo do not support images.");
            }

            throw new Error(responseJson.error.message || "An error occurred while processing the request.");
        }

        if (!response.ok) {
            throw new Error(responseJson["error"]?.["message"] || `HTTP error! status: ${response.status}`);
        }

        return responseJson.choices?.[0]?.message?.content?.trim() || "";
    }

    return {
        requestAI
    }
}

export default useOpenAI;
