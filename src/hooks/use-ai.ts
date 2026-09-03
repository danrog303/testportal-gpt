import usePluginConfig from "~hooks/use-plugin-config";
import useContexts from "~hooks/use-contexts";
import { getProvider } from "~providers";
import type { ProviderFileRef } from "~providers/ai-provider";
import { t } from "~i18n";

import { normalizeImageDataUrl } from "~utils/image";

function useAI() {
    const { pluginConfig } = usePluginConfig();
    const { getActiveContext } = useContexts();

    function prepareParams(prompt: string, images: (string | null | undefined)[] | string | undefined = undefined) {
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
        const validImages = imageAttachments
            .filter((img): img is string => typeof img === "string" && img.length > 0)
            .map(normalizeImageDataUrl);

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

        return {
            provider,
            requestParams: {
                apiKey: pluginConfig.apiKey,
                model: pluginConfig.apiModel,
                prompt,
                images: validImages.length > 0 ? validImages : undefined,
                systemInstructions,
                fileRefs: fileRefs.length > 0 ? fileRefs : undefined,
                fileContextId: activeContext?.fileContextId || undefined
            }
        };
    }

    async function requestAI(prompt: string, images: (string | null | undefined)[] | string | undefined = undefined): Promise<string> {
        const { provider, requestParams } = prepareParams(prompt, images);
        return provider.requestAI(requestParams);
    }

    async function streamAI(
        prompt: string,
        onChunk: (chunk: string) => void,
        images: (string | null | undefined)[] | string | undefined = undefined,
        signal?: AbortSignal
    ): Promise<string> {
        const { provider, requestParams } = prepareParams(prompt, images);
        return provider.streamAI({
            ...requestParams,
            onChunk,
            signal
        });
    }

    return {
        requestAI,
        streamAI
    }
}

export default useAI;
