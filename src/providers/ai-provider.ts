export type ProviderType = "openai" | "gemini" | "claude";

export interface AIProvider {
    /** Send a prompt (with optional images and file context) and get a text response */
    requestAI(params: AIRequestParams): Promise<string>;

    /** Fetch available models from the provider's API */
    listModels(apiKey: string): Promise<AIModel[]>;

    /** Get the default model ID to use if none is selected, given the list of available models */
    getDefaultModelId?(models: AIModel[]): string | undefined;

    /** Upload a file for context. Returns a provider-specific file reference. */
    uploadFile(apiKey: string, file: File, contextName: string): Promise<UploadedFileResult>;

    /** Delete a previously uploaded file */
    deleteFile(apiKey: string, fileRef: ProviderFileRef): Promise<void>;

    /** Clean up any provider-specific file context resources (e.g. OpenAI vector stores) */
    deleteFileContext?(apiKey: string, fileContextId: string): Promise<void>;
}

export interface AIRequestParams {
    apiKey: string;
    model: string;
    prompt: string;
    images?: string[];
    systemInstructions?: string;
    /** Provider-specific file references to attach as document context */
    fileRefs?: ProviderFileRef[];
    /** Provider-specific context ID (e.g. OpenAI vector store ID) */
    fileContextId?: string;
}

export interface AIModel {
    id: string;
    displayName: string;
}

export interface ProviderFileRef {
    /** Provider-specific file identifier */
    fileId: string;
    /** For Gemini: the file URI needed to reference it in requests */
    fileUri?: string;
    /** For Gemini: the MIME type needed to reference it in requests */
    mimeType?: string;
}

export interface UploadedFileResult {
    fileRef: ProviderFileRef;
    /** For OpenAI: the vector store ID created/used during file upload */
    fileContextId?: string;
}
