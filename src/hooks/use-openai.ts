import usePluginConfig from "~hooks/use-plugin-config";
import useContexts from "~hooks/use-contexts";

function useOpenAI() {
    const { pluginConfig } = usePluginConfig();
    const { getActiveContext } = useContexts();

    async function requestAI(prompt: string, imageAttachment: string | undefined = undefined): Promise<string> {
        if (!pluginConfig.apiKey) {
            throw new Error("API key is not set in TestportalGPT plugin configuration.");
        }

        const activeContext = getActiveContext();

        const input: any[] = [];
        const userMessage: any = {
            type: "message",
            role: "user",
            content: imageAttachment
                ? [
                    { type: "input_text", text: prompt },
                    { type: "input_image", image_url: imageAttachment }
                ]
                : prompt
        };
        input.push(userMessage);

        const requestBody: any = {
            model: pluginConfig.apiModel,
            input: input
        };

        if (activeContext?.textContent) {
            requestBody.instructions = `Use the following context information when answering:\n\n${activeContext.textContent}`;
        }

        if (activeContext?.vectorStoreId) {
            requestBody.tools = [
                {
                    type: "file_search",
                    vector_store_ids: [activeContext.vectorStoreId]
                }
            ];
        }

        let response: Response;
        try {
            response = await fetch("https://api.openai.com/v1/responses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${pluginConfig.apiKey}`,
                },
                body: JSON.stringify(requestBody)
            });
        } catch (error) {
            throw new Error(`Failed to fetch from OpenAI API: ${error.message}`);
        }

        const responseJson = await response.json();

        if (responseJson.error) {
            if (responseJson.error.message?.includes("Invalid image")) {
                throw new Error("Model could not process the image. " +
                    "Make sure you've chosen a model that supports images, like gpt-4o. " +
                    "Simple text models like gpt-3.5-turbo do not support images.");
            }

            throw new Error(responseJson.error.message || "An error occurred while processing the request.");
        }

        if (!response.ok) {
            throw new Error(responseJson.error?.message || `HTTP error! status: ${response.status}`);
        }

        const output = responseJson.output;
        if (Array.isArray(output)) {
            const messageOutput = output.find((item: any) => item.type === "message");
            if (messageOutput?.content) {
                const textContent = messageOutput.content.find((c: any) => c.type === "output_text");
                if (textContent?.text) {
                    return textContent.text.trim();
                }
            }
        }

        if (responseJson.output_text) {
            return responseJson.output_text.trim();
        }

        throw new Error("Could not extract response text from OpenAI API response.");
    }

    return {
        requestAI
    }
}

export default useOpenAI;
