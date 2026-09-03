import usePluginConfig from "~hooks/use-plugin-config";
import { getProvider } from "~providers";
import type { ProviderFileRef, UploadedFileResult } from "~providers/ai-provider";
import { OpenAIProvider } from "~providers/openai-provider";

export default function useProviderFiles() {
    const { pluginConfig } = usePluginConfig();

    async function uploadFile(file: File, contextName: string): Promise<UploadedFileResult> {
        const provider = getProvider(pluginConfig.provider);
        return provider.uploadFile(pluginConfig.apiKey, file, contextName);
    }

    async function deleteFile(fileRef: ProviderFileRef): Promise<void> {
        const provider = getProvider(pluginConfig.provider);
        return provider.deleteFile(pluginConfig.apiKey, fileRef);
    }

    async function deleteFileContext(fileContextId: string): Promise<void> {
        const provider = getProvider(pluginConfig.provider);
        if (provider.deleteFileContext) {
            return provider.deleteFileContext(pluginConfig.apiKey, fileContextId);
        }
    }

    // OpenAI-specific vector store operations
    async function createVectorStore(name: string): Promise<string> {
        const provider = getProvider(pluginConfig.provider);
        if (provider instanceof OpenAIProvider) {
            return provider.createVectorStore(pluginConfig.apiKey, name);
        }
        throw new Error("Vector stores are only supported with OpenAI");
    }

    async function addFileToVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
        const provider = getProvider(pluginConfig.provider);
        if (provider instanceof OpenAIProvider) {
            return provider.addFileToVectorStore(pluginConfig.apiKey, vectorStoreId, fileId);
        }
        throw new Error("Vector stores are only supported with OpenAI");
    }

    async function removeFileFromVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
        const provider = getProvider(pluginConfig.provider);
        if (provider instanceof OpenAIProvider) {
            return provider.removeFileFromVectorStore(pluginConfig.apiKey, vectorStoreId, fileId);
        }
        throw new Error("Vector stores are only supported with OpenAI");
    }

    return {
        uploadFile,
        deleteFile,
        deleteFileContext,
        createVectorStore,
        addFileToVectorStore,
        removeFileFromVectorStore
    };
}
