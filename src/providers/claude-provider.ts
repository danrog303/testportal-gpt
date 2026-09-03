import { AIProvider, AIRequestParams, AIStreamRequestParams, AIModel, UploadedFileResult, ProviderFileRef } from "./ai-provider";
import { readSSEStream } from "~utils/sse";
import { t } from "~i18n";

export class ClaudeProvider implements AIProvider {
    private readonly apiBase = "https://api.anthropic.com/v1";
    private readonly anthropicVersion = "2023-06-01";

    private buildHeaders(apiKey: string): Record<string, string> {
        const parts = apiKey.split("|");
        const actualApiKey = parts[0];
        const workspaceId = parts.length > 1 ? parts[1] : undefined;

        const headers: Record<string, string> = {
            "x-api-key": actualApiKey,
            "anthropic-version": this.anthropicVersion,
            "anthropic-dangerous-direct-browser-access": "true",
            "content-type": "application/json",
        };

        if (workspaceId) {
            headers["anthropic-workspace-id"] = workspaceId;
        }

        return headers;
    }

    private buildRequestBody(params: AIRequestParams, stream = false): any {
        const content: any[] = [];
        
        if (params.images && params.images.length > 0) {
            for (const img of params.images) {
                let mediaType = "image/png";
                let data = img;
                
                if (img.startsWith("data:")) {
                    const match = img.match(/^data:([^;]+);base64,(.*)$/);
                    if (match) {
                        mediaType = match[1];
                        data = match[2];
                    }
                }

                content.push({
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: mediaType,
                        data: data
                    }
                });
            }
        }

        if (params.fileRefs && params.fileRefs.length > 0) {
            for (const fileRef of params.fileRefs) {
                content.push({
                    type: "document",
                    source: {
                        type: "file",
                        file_id: fileRef.fileId
                    }
                });
            }
        }
        
        content.push({
            type: "text",
            text: params.prompt
        });

        const body: any = {
            model: params.model,
            max_tokens: 16384,
            messages: [{ role: "user", content: content }]
        };

        if (stream) {
            body.stream = true;
        }

        if (params.systemInstructions) {
            body.system = params.systemInstructions;
        }

        return body;
    }

    private async handleErrorResponse(response: Response): Promise<never> {
        let errorMsg = "Claude API error";
        if (response.status === 401) {
            errorMsg = "Invalid Claude API key";
        }
        try {
            const errData = await response.json();
            if (errData.error?.message) {
                if (errData.error.message.includes("credit balance is too low")) {
                    errorMsg = t("errorClaudeCredits");
                } else if (errData.error.message.includes("anthropic-workspace-id is required")) {
                    errorMsg = t("errorClaudeWorkspaceId");
                } else {
                    errorMsg += `: ${errData.error.message}`;
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
        throw new Error(errorMsg);
    }

    async requestAI(params: AIRequestParams): Promise<string> {
        const headers = this.buildHeaders(params.apiKey);
        const body = this.buildRequestBody(params, false);

        const response = await fetch(`${this.apiBase}/messages`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            await this.handleErrorResponse(response);
        }

        const data = await response.json();
        const textBlock = data.content?.find((block: any) => block.type === "text");
        
        if (!textBlock) {
            throw new Error("No text response from Claude");
        }
        
        return textBlock.text;
    }

    async streamAI(params: AIStreamRequestParams): Promise<string> {
        const { apiKey, onChunk, signal } = params;
        const headers = this.buildHeaders(apiKey);
        const body = this.buildRequestBody(params, true);

        let response: Response;
        try {
            response = await fetch(`${this.apiBase}/messages`, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal
            });
        } catch (error: any) {
            if (signal?.aborted) {
                return "";
            }
            throw new Error(`Failed to fetch from Claude API: ${error.message}`);
        }

        if (!response.ok) {
            await this.handleErrorResponse(response);
        }

        let accumulatedText = "";

        await readSSEStream(
            response,
            msg => {
                const { event, data } = msg;
                if (!data) return;

                if (event === "error" || data.type === "error" || data.error) {
                    throw new Error(data.error?.message || "Claude stream error");
                }

                if (data.type === "content_block_delta" && data.delta) {
                    if (data.delta.type === "text_delta" && typeof data.delta.text === "string") {
                        accumulatedText += data.delta.text;
                        onChunk(data.delta.text);
                    } else if (data.delta.type === "thinking_delta" && typeof data.delta.thinking === "string") {
                        accumulatedText += data.delta.thinking;
                        onChunk(data.delta.thinking);
                    }
                }
            },
            signal
        );

        if (!accumulatedText && !signal?.aborted) {
            throw new Error("No response content was received from Claude.");
        }

        return accumulatedText.trim();
    }

    async listModels(apiKey: string): Promise<AIModel[]> {
        const parts = apiKey.split("|");
        const actualApiKey = parts[0];
        const workspaceId = parts.length > 1 ? parts[1] : undefined;

        const headers: any = {
            "x-api-key": actualApiKey,
            "anthropic-version": this.anthropicVersion,
            "anthropic-dangerous-direct-browser-access": "true",
        };

        if (workspaceId) {
            headers["anthropic-workspace-id"] = workspaceId;
        }

        const models: AIModel[] = [];
        let hasMore = true;
        let afterId = "";

        while (hasMore) {
            const url = new URL(`${this.apiBase}/models`);
            if (afterId) {
                url.searchParams.append("after_id", afterId);
            }

            const response = await fetch(url.toString(), { method: "GET", headers });
            
            if (!response.ok) {
                let errorMsg = `Failed to list Claude models: ${response.status}`;
                try {
                    const errData = await response.json();
                    if (errData.error?.message) {
                        if (errData.error.message.includes("credit balance is too low")) {
                            errorMsg = t("errorClaudeCredits");
                        } else if (errData.error.message.includes("anthropic-workspace-id is required")) {
                            errorMsg = t("errorClaudeWorkspaceId");
                        } else {
                            errorMsg += `: ${errData.error.message}`;
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            
            for (const model of data.data || []) {
                if (model.capabilities?.image_input?.supported === true) {
                    models.push({
                        id: model.id,
                        displayName: model.display_name || model.id
                    });
                }
            }
            
            hasMore = data.has_more;
            if (hasMore) {
                afterId = data.last_id;
            }
        }
        models.sort((a, b) => b.displayName.localeCompare(a.displayName));
        
        return models;
    }

    getDefaultModelId(models: AIModel[]): string | undefined {
        const sonnet = models.find(m => m.id.includes("sonnet"));
        if (sonnet) return sonnet.id;
        return undefined;
    }

    async uploadFile(apiKey: string, file: File, contextName: string): Promise<UploadedFileResult> {
        const parts = apiKey.split("|");
        const actualApiKey = parts[0];
        const workspaceId = parts.length > 1 ? parts[1] : undefined;

        const headers: any = {
            "x-api-key": actualApiKey,
            "anthropic-version": this.anthropicVersion,
            "anthropic-dangerous-direct-browser-access": "true"
        };
        if (workspaceId) {
            headers["anthropic-workspace-id"] = workspaceId;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${this.apiBase}/files`, {
            method: "POST",
            headers,
            body: formData
        });

        if (!response.ok) {
            let errorMsg = `Failed to upload file to Claude: ${response.status}`;
            try {
                const errData = await response.json();
                if (errData.error?.message) {
                    if (errData.error.message.includes("credit balance is too low")) {
                        errorMsg = t("errorClaudeCredits");
                    } else if (errData.error.message.includes("anthropic-workspace-id is required")) {
                        errorMsg = t("errorClaudeWorkspaceId");
                    } else {
                        errorMsg += `: ${errData.error.message}`;
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        return {
            fileRef: {
                fileId: data.id
            }
        };
    }

    async deleteFile(apiKey: string, fileRef: ProviderFileRef): Promise<void> {
        const parts = apiKey.split("|");
        const actualApiKey = parts[0];
        const workspaceId = parts.length > 1 ? parts[1] : undefined;

        const headers: any = {
            "x-api-key": actualApiKey,
            "anthropic-version": this.anthropicVersion,
            "anthropic-dangerous-direct-browser-access": "true"
        };
        if (workspaceId) {
            headers["anthropic-workspace-id"] = workspaceId;
        }

        const response = await fetch(`${this.apiBase}/files/${fileRef.fileId}`, {
            method: "DELETE",
            headers
        });

        if (!response.ok) {
            let errorMsg = `Failed to delete file from Claude: ${response.status}`;
            try {
                const errData = await response.json();
                if (errData.error?.message) {
                    errorMsg += `: ${errData.error.message}`;
                }
            } catch (e) {
                // Ignore parse errors
            }
            throw new Error(errorMsg);
        }
    }

    async deleteFileContext(apiKey: string, fileContextId: string): Promise<void> {
        // No-op for Claude
        return;
    }
}

export const claudeProvider = new ClaudeProvider();
