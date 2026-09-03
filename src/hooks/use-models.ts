import { useEffect, useState } from "react";

import usePluginConfig from "~hooks/use-plugin-config";
import { getProvider } from "~providers";
import type { AIModel } from "~providers/ai-provider";

export default function useModels() {
    const { pluginConfig } = usePluginConfig();
    const [models, setModels] = useState<AIModel[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchModels() {
        const currentProvider = pluginConfig.provider || "openai";
        const currentKey = pluginConfig.apiKey?.trim();

        if (!currentKey) {
            setModels([]);
            setError(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setModels([]);

        try {
            const provider = getProvider(currentProvider);
            const fetchedModels = await provider.listModels(currentKey);
            // Verify that provider hasn't changed during fetch
            if (pluginConfig.provider === currentProvider) {
                setModels(fetchedModels);
            }
        } catch (err) {
            if (pluginConfig.provider === currentProvider) {
                setError(err instanceof Error ? err.message : "Failed to fetch models");
                setModels([]);
            }
        } finally {
            if (pluginConfig.provider === currentProvider) {
                setIsLoading(false);
            }
        }
    }

    useEffect(() => {
        fetchModels();
    }, [pluginConfig.provider, pluginConfig.apiKey]);

    return {
        models,
        isLoading,
        error,
        refetch: fetchModels
    };
}
