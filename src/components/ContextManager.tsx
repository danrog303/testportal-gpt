import React, { useState, useRef } from "react";
import useContexts from "~hooks/use-contexts";
import usePluginConfig from "~hooks/use-plugin-config";
import useOpenAIFiles from "~hooks/use-openai-files";
import { generateId, type ContextFile } from "~models/context";

export default function ContextManager() {
    const {
        contexts,
        activeContextId,
        setActiveContextId,
        addContext,
        deleteContext: removeContext,
        setContextText,
        addFileToContext,
        removeFileFromContext,
        setContextVectorStore,
        getContext
    } = useContexts();
    const { pluginConfig } = usePluginConfig();
    const {
        uploadFile,
        deleteFile,
        createVectorStore,
        deleteVectorStore,
        addFileToVectorStore,
        removeFileFromVectorStore
    } = useOpenAIFiles();

    const [newContextName, setNewContextName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeContext = activeContextId ? getContext(activeContextId) : null;

    async function handleCreateContext() {
        if (!newContextName.trim()) return;
        addContext(newContextName.trim());
        setNewContextName("");
    }

    async function handleDeleteContext() {
        if (!activeContext || isDeleting) return;

        setIsDeleting(true);
        try {
            for (const file of activeContext.files) {
                try {
                    await deleteFile(file.openaiFileId);
                } catch (e) {
                    console.warn("Failed to delete file from OpenAI:", e);
                }
            }

            if (activeContext.vectorStoreId) {
                try {
                    await deleteVectorStore(activeContext.vectorStoreId);
                } catch (e) {
                    console.warn("Failed to delete vector store from OpenAI:", e);
                }
            }

            removeContext(activeContext.id);
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files || files.length === 0 || !activeContext) return;
        if (!pluginConfig.apiKey) {
            setUploadError("Please set your OpenAI API key first.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            for (const file of Array.from(files)) {
                const openaiFileId = await uploadFile(file);

                let vectorStoreId = activeContext.vectorStoreId;
                if (!vectorStoreId) {
                    vectorStoreId = await createVectorStore(
                        `testportal-gpt-${activeContext.name}`
                    );
                    setContextVectorStore(activeContext.id, vectorStoreId);
                }

                await addFileToVectorStore(vectorStoreId, openaiFileId);

                const contextFile: ContextFile = {
                    id: generateId(),
                    name: file.name,
                    openaiFileId,
                    size: file.size,
                    uploadedAt: Date.now()
                };
                addFileToContext(activeContext.id, contextFile);
            }
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Failed to upload file.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }

    async function handleRemoveFile(fileId: string) {
        if (!activeContext) return;

        const file = activeContext.files.find(f => f.id === fileId);
        if (!file) return;

        try {
            if (activeContext.vectorStoreId) {
                await removeFileFromVectorStore(
                    activeContext.vectorStoreId,
                    file.openaiFileId
                );
            }

            await deleteFile(file.openaiFileId);
        } catch (e) {
            console.warn("Failed to delete file from OpenAI:", e);
        }

        removeFileFromContext(activeContext.id, fileId);
    }

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return (
        <div className="context-manager">
            <label className="popup-field-label">Context management:</label>
            <p>
                Create and manage contexts with text and file attachments.
                Files will be uploaded to OpenAI and used to answer questions.
            </p>

            <div className="context-selector">
                <select
                    value={activeContextId || ""}
                    onChange={e => setActiveContextId(e.target.value || null)}
                >
                    <option value="">-- No context selected --</option>
                    {contexts.map(ctx => (
                        <option key={ctx.id} value={ctx.id}>{ctx.name}</option>
                    ))}
                </select>
            </div>

            <div className="context-create">
                <input
                    type="text"
                    placeholder="New context name..."
                    value={newContextName}
                    onChange={e => setNewContextName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateContext()}
                />
                <button onClick={handleCreateContext} disabled={!newContextName.trim()}>
                    Create
                </button>
            </div>

            {activeContext && (
                <div className="context-editor">
                    <h4>{activeContext.name}</h4>

                    <label className="context-text-label">Text content:</label>
                    <textarea
                        value={activeContext.textContent}
                        onChange={e => setContextText(activeContext.id, e.target.value)}
                        placeholder="Add text context that will be included in prompts..."
                    />

                    <label className="context-files-label">Files:</label>
                    <div className="context-file-upload">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            accept=".pdf,.txt,.md,.html,.docx,.doc,.csv,.json"
                        />
                        {isUploading && <span className="upload-status">Uploading...</span>}
                    </div>

                    {uploadError && (
                        <p className="context-upload-error">{uploadError}</p>
                    )}

                    {activeContext.files.length > 0 && (
                        <ul className="context-file-list">
                            {activeContext.files.map(file => (
                                <li key={file.id}>
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-size">({formatFileSize(file.size)})</span>
                                    <button
                                        className="file-remove-btn"
                                        onClick={() => handleRemoveFile(file.id)}
                                        title="Remove file"
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <button
                        className="context-delete-btn"
                        onClick={handleDeleteContext}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete context"}
                    </button>
                </div>
            )}
        </div>
    );
}
