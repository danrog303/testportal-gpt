import { AIModel, AIProvider, AIRequestParams, ProviderFileRef, UploadedFileResult } from "./ai-provider";

export class OpenAIProvider implements AIProvider {
    async requestAI(params: AIRequestParams): Promise<string> {
        const { apiKey, model, prompt, images, systemInstructions, fileContextId } = params;

        let imageAttachments: string[] = [];
        if (Array.isArray(images)) {
            imageAttachments = images.filter(img => img) as string[];
        }

        const content: any[] = [{ type: "input_text", text: prompt }];
        imageAttachments.forEach(img => {
            content.push({ type: "input_image", image_url: img });
        });

        const input: any[] = [];
        const userMessage: any = {
            type: "message",
            role: "user",
            content: imageAttachments.length > 0 ? content : prompt
        };
        input.push(userMessage);

        const requestBody: any = {
            model: model,
            input: input
        };

        if (systemInstructions) {
            requestBody.instructions = systemInstructions;
        }

        if (fileContextId) {
            requestBody.tools = [
                {
                    type: "file_search",
                    vector_store_ids: [fileContextId]
                }
            ];
            const fileSearchNote = "\n\nImportant: You have access to files. Please search the files for relevant information to answer the question.";
            if (requestBody.instructions) {
                requestBody.instructions += fileSearchNote;
            } else {
                requestBody.instructions = fileSearchNote.trim();
            }
        }

        let response: Response;
        try {
            response = await fetch("https://api.openai.com/v1/responses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(requestBody)
            });
        } catch (error: any) {
            throw new Error(`Failed to fetch from OpenAI API: ${error.message}`);
        }

        const responseJson = await response.json();

        if (response.status === 401) {
            throw new Error("OpenAI API returned 'Unauthorized' (401). This usually means your API key is invalid or you have run out of credits/quota. Please check your OpenAI billing settings.");
        }

        if (responseJson.error) {
            if (responseJson.error.message?.includes("Invalid image")) {
                throw new Error("Model could not process the image. Make sure you've chosen a model that supports images.");
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

    async listModels(apiKey: string): Promise<AIModel[]> {
        const response = await fetch("https://api.openai.com/v1/models", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || `Failed to fetch models: ${response.status}`);
        }

        const data = await response.json();
        const models: any[] = data.data || [];

        const filteredModels = models
            .map((m: any) => m.id)
            .filter((id: string) => {
                const lowerId = id.toLowerCase();
                
                // Allow only standard chat prefixes
                const isAllowedPrefix = lowerId.startsWith("gpt-") || lowerId.startsWith("o1") || lowerId.startsWith("o3");
                if (!isAllowedPrefix) {
                    return false;
                }

                // Exclude specific unwanted types
                const hasDateSuffix = /\d{4}-\d{2}-\d{2}$/.test(lowerId);
                const hasUnwantedSuffix = lowerId.endsWith("-chat-latest") ||
                                          lowerId.endsWith("-instruct") ||
                                          /-instruct-\d+$/.test(lowerId) ||
                                          lowerId.endsWith("-search-api");

                const isExcluded = lowerId.includes("gpt-audio") ||
                                   lowerId.includes("omni") ||
                                   lowerId.includes("sora") ||
                                   lowerId.includes("gpt-realtime") ||
                                   lowerId.includes("gpt-live") ||
                                   lowerId.includes("tts") ||
                                   lowerId.includes("transcribe") ||
                                   lowerId.includes("gpt-image") ||
                                   lowerId.includes("preview") ||
                                   hasDateSuffix ||
                                   hasUnwantedSuffix;
                                   
                return !isExcluded;
            })
            .sort((a: string, b: string) => b.localeCompare(a));

        return filteredModels.map((id: string) => ({
            id,
            displayName: id
        }));
    }

    getDefaultModelId(models: AIModel[]): string | undefined {
        const eligibleModels = models.filter(m => !m.id.toLowerCase().includes("pro"));
        
        if (eligibleModels.length === 0) {
            return models[0]?.id;
        }

        const scoredModels = eligibleModels.map(m => {
            const match = m.id.match(/(\d+(?:\.\d+)?)/);
            const version = match ? parseFloat(match[1]) : 0;
            return { id: m.id, version };
        });

        scoredModels.sort((a, b) => {
            if (a.version !== b.version) {
                return b.version - a.version;
            }
            // Tie-breaker for identical versions (e.g. gpt-4o > gpt-4)
            return b.id.localeCompare(a.id);
        });

        return scoredModels[0].id;
    }

    async uploadFile(apiKey: string, file: File, contextName: string): Promise<UploadedFileResult> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", "assistants");

        const response = await fetch("https://api.openai.com/v1/files", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Failed to upload file: ${response.status}`);
        }

        return {
            fileRef: { fileId: data.id }
        };
    }

    async deleteFile(apiKey: string, fileRef: ProviderFileRef): Promise<void> {
        const response = await fetch(`https://api.openai.com/v1/files/${fileRef.fileId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || `Failed to delete file: ${response.status}`);
        }
    }

    async deleteFileContext(apiKey: string, fileContextId: string): Promise<void> {
        const response = await fetch(`https://api.openai.com/v1/vector_stores/${fileContextId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || `Failed to delete vector store: ${response.status}`);
        }
    }

    async createVectorStore(apiKey: string, name: string): Promise<string> {
        const response = await fetch("https://api.openai.com/v1/vector_stores", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Failed to create vector store: ${response.status}`);
        }

        return data.id;
    }

    async addFileToVectorStore(apiKey: string, vectorStoreId: string, fileId: string): Promise<void> {
        const response = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ file_id: fileId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Failed to add file to vector store: ${response.status}`);
        }
    }

    async removeFileFromVectorStore(apiKey: string, vectorStoreId: string, fileId: string): Promise<void> {
        const response = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files/${fileId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || `Failed to remove file from vector store: ${response.status}`);
        }
    }
}

export const openaiProvider = new OpenAIProvider();
