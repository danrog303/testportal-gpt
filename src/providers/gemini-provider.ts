import { AIProvider, AIRequestParams, AIModel, UploadedFileResult, ProviderFileRef } from "./ai-provider";

export class GeminiProvider implements AIProvider {
    async requestAI(params: AIRequestParams): Promise<string> {
        const input: any[] = [];
        
        let finalPrompt = params.prompt;
        if (params.systemInstructions) {
            finalPrompt = `System Instructions:\n${params.systemInstructions}\n\nUser Question:\n${params.prompt}`;
        }

        input.push({ type: "text", text: finalPrompt });

        if (params.images && params.images.length > 0) {
            for (const image of params.images) {
                let base64Data = image;
                let mimeType = "image/png";

                if (image.startsWith("data:")) {
                    const commaIdx = image.indexOf(",");
                    if (commaIdx !== -1) {
                        const prefix = image.substring(0, commaIdx);
                        const match = prefix.match(/data:([^;]+);/);
                        if (match && match[1]) {
                            mimeType = match[1];
                        }
                        base64Data = image.substring(commaIdx + 1);
                    }
                }
                
                input.push({
                    type: "image",
                    data: base64Data,
                    mime_type: mimeType
                });
            }
        }

        if (params.fileRefs && params.fileRefs.length > 0) {
            for (const ref of params.fileRefs) {
                if (ref.fileUri) {
                    input.push({
                        type: "document",
                        uri: ref.fileUri,
                        mime_type: ref.mimeType || "application/pdf"
                    });
                }
            }
        }

        const modelId = params.model.startsWith("models/") ? params.model.substring(7) : params.model;

        const body: any = {
            model: modelId,
            input: input
        };

        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
            method: "POST",
            headers: {
                "x-goog-api-key": params.apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            const rawMessage = data.error?.message || "";
            
            if (response.status === 429 || rawMessage.toLowerCase().includes("quota exceeded") || rawMessage.toLowerCase().includes("rate limit")) {
                let niceMessage = "Gemini API quota exceeded or rate limit reached.";
                
                const retryMatch = rawMessage.match(/retry in ([\d\.]+)s/i);
                if (retryMatch) {
                    const seconds = Math.ceil(parseFloat(retryMatch[1]));
                    niceMessage += ` Please retry in ${seconds} seconds.`;
                }
                
                if (rawMessage.toLowerCase().includes("free_tier") || rawMessage.toLowerCase().includes("billing")) {
                    niceMessage += " (Pro models often require a paid billing account on Google AI Studio).";
                }
                
                throw new Error(niceMessage);
            }

            throw new Error(rawMessage || "Error generating content from Gemini");
        }

        if (data.output_text) {
            return data.output_text;
        }

        if (data.steps && Array.isArray(data.steps)) {
            let fullText = "";
            for (const step of data.steps) {
                if (step.content && Array.isArray(step.content)) {
                    for (const content of step.content) {
                        if (content.type === "text" && content.text) {
                            fullText += content.text;
                        }
                    }
                }
            }
            if (fullText) {
                return fullText;
            }
        }

        return "";
    }

    async listModels(apiKey: string): Promise<AIModel[]> {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "Failed to list models");
        }

        const models: AIModel[] = [];
        if (data.models && Array.isArray(data.models)) {
            for (const m of data.models) {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    const lowerName = m.displayName.toLowerCase();
                    
                    const isGemini = lowerName.includes("gemini");
                    const isFlashOrPro = lowerName.includes("flash") || lowerName.includes("pro");
                    const isExcluded = lowerName.includes("tts") || 
                                       lowerName.includes("transcribe") ||
                                       lowerName.includes("omni") ||
                                       lowerName.includes("preview") ||
                                       lowerName.includes("gemini 2.5") ||
                                       m.name.toLowerCase().includes("gemini-2.5");
                    
                    if (isGemini && isFlashOrPro && !isExcluded) {
                        models.push({
                            id: m.name,
                            displayName: m.displayName
                        });
                    }
                }
            }
        }

        models.sort((a, b) => b.displayName.localeCompare(a.displayName));
        return models;
    }

    getDefaultModelId(models: AIModel[]): string | undefined {
        const flashModels = models.filter(m => m.id.toLowerCase().includes("flash"));
        if (flashModels.length === 0) return undefined;

        flashModels.sort((a, b) => {
            const getVersion = (id: string) => {
                const match = id.match(/(\d+(\.\d+)?)/);
                return match ? parseFloat(match[1]) : 0;
            };
            return getVersion(b.id) - getVersion(a.id);
        });

        return flashModels[0].id;
    }

    async uploadFile(apiKey: string, file: File, contextName: string): Promise<UploadedFileResult> {
        // Step 1: Initiate upload
        const initResponse = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
            method: "POST",
            headers: {
                "X-Goog-Upload-Protocol": "resumable",
                "X-Goog-Upload-Command": "start",
                "X-Goog-Upload-Header-Content-Length": file.size.toString(),
                "X-Goog-Upload-Header-Content-Type": file.type || "application/octet-stream",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ file: { display_name: file.name } })
        });

        if (!initResponse.ok) {
            const data = await initResponse.json().catch(() => null);
            throw new Error(data?.error?.message || "Failed to initiate file upload");
        }

        // Step 2: Get upload URL
        const uploadUrl = initResponse.headers.get("x-goog-upload-url");
        if (!uploadUrl) {
            throw new Error("Missing x-goog-upload-url header in upload initialization response");
        }

        // Step 3: Upload bytes
        const fileBuffer = await file.arrayBuffer();
        const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Length": file.size.toString(),
                "X-Goog-Upload-Offset": "0",
                "X-Goog-Upload-Command": "upload, finalize"
            },
            body: fileBuffer
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
            throw new Error(uploadData.error?.message || "Failed to upload file bytes");
        }

        // Step 4: Parse response
        return {
            fileRef: {
                fileId: uploadData.file.name,
                fileUri: uploadData.file.uri,
                mimeType: uploadData.file.mimeType
            }
        };
    }

    async deleteFile(apiKey: string, fileRef: ProviderFileRef): Promise<void> {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileRef.fileId}?key=${apiKey}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.error?.message || `Failed to delete file ${fileRef.fileId}`);
        }
    }

    async deleteFileContext(apiKey: string, fileContextId: string): Promise<void> {
        // No-op for Gemini
        return;
    }
}

export const geminiProvider = new GeminiProvider();
