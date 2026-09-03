import usePluginConfig from "~hooks/use-plugin-config";
import useContexts from "~hooks/use-contexts";
import { getProvider } from "~providers";
import type { ProviderFileRef } from "~providers/ai-provider";
import { t } from "~i18n";

function useAI() {
    const { pluginConfig } = usePluginConfig();
    const { getActiveContext } = useContexts();

    async function requestAI(prompt: string, images: (string | null | undefined)[] | string | undefined = undefined): Promise<string> {
        if (!pluginConfig.apiKey) {
            throw new Error(t("errorApiKeyNotSet"));
        }

        const provider = getProvider(pluginConfig.provider);
        const activeContext = getActiveContext();

        // Normalize images argument to an array of valid strings
        let imageAttachments: (string | null | undefined)[] = [];
        if (Array.isArray(images)) {
            imageAttachments = images;
        } else if (typeof images === "string") {
            imageAttachments = [images];
        }
        const validImages = imageAttachments.filter(img => img) as string[];

        // Build system instructions from context
        let systemInstructions: string;
        if (activeContext?.textContent) {
            systemInstructions = `Use the following context information when answering:\n\n${activeContext.textContent}`;
        } else {
            systemInstructions = "You are an expert assistant. Solve the question accurately.";
        }

        // Build file refs from active context (only files matching current provider)
        const fileRefs: ProviderFileRef[] = [];
        if (activeContext?.files) {
            for (const file of activeContext.files) {
                if (file.provider === pluginConfig.provider) {
                    fileRefs.push({
                        fileId: file.providerFileId,
                        fileUri: file.providerFileUri,
                        mimeType: file.providerFileMimeType
                    });
                }
            }
        }

        return provider.requestAI({
            apiKey: pluginConfig.apiKey,
            model: pluginConfig.apiModel,
            prompt,
            images: validImages.length > 0 ? validImages : undefined,
            systemInstructions,
            fileRefs: fileRefs.length > 0 ? fileRefs : undefined,
            fileContextId: activeContext?.fileContextId || undefined
        });
    }

    return {
        requestAI
    }
}

export default useAI;
