import usePluginConfig from "~hooks/use-plugin-config";

const OPENAI_API_BASE = "https://api.openai.com/v1";

export default function useOpenAIFiles() {
    const { pluginConfig } = usePluginConfig();

    async function uploadFile(file: File, purpose: string = "assistants"): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", purpose);

        const response = await fetch(`${OPENAI_API_BASE}/files`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${pluginConfig.apiKey}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Failed to upload file: ${response.status}`);
        }

        return data.id;
    }

    async function deleteFile(fileId: string): Promise<void> {
        const response = await fetch(`${OPENAI_API_BASE}/files/${fileId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${pluginConfig.apiKey}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || `Failed to delete file: ${response.status}`);
        }
    }

    async function createVectorStore(name: string): Promise<string> {
        const response = await fetch(`${OPENAI_API_BASE}/vector_stores`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${pluginConfig.apiKey}`,
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

    async function deleteVectorStore(vectorStoreId: string): Promise<void> {
        const response = await fetch(`${OPENAI_API_BASE}/vector_stores/${vectorStoreId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${pluginConfig.apiKey}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || `Failed to delete vector store: ${response.status}`);
        }
    }

    async function addFileToVectorStore(vectorStoreId: string, fileId: string): Promise<string> {
        const response = await fetch(`${OPENAI_API_BASE}/vector_stores/${vectorStoreId}/files`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${pluginConfig.apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ file_id: fileId })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Failed to add file to vector store: ${response.status}`);
        }

        return data.id;
    }

    async function removeFileFromVectorStore(vectorStoreId: string, fileId: string): Promise<void> {
        const response = await fetch(`${OPENAI_API_BASE}/vector_stores/${vectorStoreId}/files/${fileId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${pluginConfig.apiKey}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error?.message || `Failed to remove file from vector store: ${response.status}`);
        }
    }

    async function isVectorStoreReady(vectorStoreId: string): Promise<boolean> {
        const response = await fetch(`${OPENAI_API_BASE}/vector_stores/${vectorStoreId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${pluginConfig.apiKey}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Failed to get vector store status: ${response.status}`);
        }

        return data.status === "completed";
    }

    async function waitForVectorStore(vectorStoreId: string, timeoutMs: number = 60000, pollIntervalMs: number = 2000): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            if (await isVectorStoreReady(vectorStoreId)) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        throw new Error("Vector store processing timed out");
    }

    return {
        uploadFile,
        deleteFile,
        createVectorStore,
        deleteVectorStore,
        addFileToVectorStore,
        removeFileFromVectorStore,
        isVectorStoreReady,
        waitForVectorStore
    };
}
