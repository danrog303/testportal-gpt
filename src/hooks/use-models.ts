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
        if (!pluginConfig.apiKey?.trim()) {
            setModels([]);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const provider = getProvider(pluginConfig.provider || "openai");
            const fetchedModels = await provider.listModels(pluginConfig.apiKey.trim());
            setModels(fetchedModels);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch models");
            setModels([]);
        } finally {
            setIsLoading(false);
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
