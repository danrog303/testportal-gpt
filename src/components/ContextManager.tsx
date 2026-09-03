import React, { useState, useRef } from "react";
import useContexts from "~hooks/use-contexts";
import usePluginConfig from "~hooks/use-plugin-config";
import useProviderFiles from "~hooks/use-provider-files";
import { generateId, type ContextFile } from "~models/context";
import { t } from "~i18n";

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
        setContextFileContextId,
        getContext
    } = useContexts();
    const { pluginConfig } = usePluginConfig();
    const {
        uploadFile,
        deleteFile,
        deleteFileContext,
        createVectorStore,
        addFileToVectorStore,
        removeFileFromVectorStore
    } = useProviderFiles();

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
                    await deleteFile({
                        fileId: file.providerFileId,
                        fileUri: file.providerFileUri,
                        mimeType: file.providerFileMimeType
                    });
                } catch (e) {
                    console.warn("Failed to delete file from provider:", e);
                }
            }

            if (activeContext.fileContextId) {
                try {
                    await deleteFileContext(activeContext.fileContextId);
                } catch (e) {
                    console.warn("Failed to delete file context:", e);
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
            setUploadError(t("setApiKeyFirst"));
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            for (const file of Array.from(files)) {
                const result = await uploadFile(file, activeContext.name);

                // For OpenAI: manage vector store
                if (pluginConfig.provider === "openai") {
                    let fileContextId = activeContext.fileContextId;
                    if (!fileContextId) {
                        fileContextId = await createVectorStore(
                            `testportal-gpt-${activeContext.name}`
                        );
                        setContextFileContextId(activeContext.id, fileContextId);
                    }
                    await addFileToVectorStore(fileContextId, result.fileRef.fileId);
                }

                const contextFile: ContextFile = {
                    id: generateId(),
                    name: file.name,
                    provider: pluginConfig.provider,
                    providerFileId: result.fileRef.fileId,
                    providerFileUri: result.fileRef.fileUri,
                    providerFileMimeType: result.fileRef.mimeType,
                    size: file.size,
                    uploadedAt: Date.now()
                };
                addFileToContext(activeContext.id, contextFile);
            }
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : t("failedToUpload"));
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
            // For OpenAI: remove from vector store first
            if (file.provider === "openai" && activeContext.fileContextId) {
                await removeFileFromVectorStore(
                    activeContext.fileContextId,
                    file.providerFileId
                );
            }

            await deleteFile({
                fileId: file.providerFileId,
                fileUri: file.providerFileUri,
                mimeType: file.providerFileMimeType
            });
        } catch (e) {
            console.warn("Failed to delete file from provider:", e);
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
            <label className="popup-field-label">{t("contextLabel")}</label>
            <p>
                {t("contextDescription")}
            </p>

            <div className="context-selector">
                <select
                    value={activeContextId || ""}
                    onChange={e => setActiveContextId(e.target.value || null)}
                >
                    <option value="">{t("noContextSelected")}</option>
                    {contexts.map(ctx => (
                        <option key={ctx.id} value={ctx.id}>{ctx.name}</option>
                    ))}
                </select>
            </div>

            <div className="context-create">
                <input
                    type="text"
                    placeholder={t("newContextPlaceholder")}
                    value={newContextName}
                    onChange={e => setNewContextName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateContext()}
                />
                <button onClick={handleCreateContext} disabled={!newContextName.trim()}>
                    {t("create")}
                </button>
            </div>

            {activeContext && (
                <div className="context-editor">
                    <h4>{activeContext.name}</h4>

                    <label className="context-text-label">{t("textContentLabel")}</label>
                    <textarea
                        value={activeContext.textContent}
                        onChange={e => setContextText(activeContext.id, e.target.value)}
                        placeholder={t("textContentPlaceholder")}
                    />

                    <label className="context-files-label">{t("filesLabel")}</label>
                    <div className="context-file-upload">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            accept=".pdf,.txt,.md,.html,.docx,.doc,.csv,.json"
                        />
                        {isUploading && <span className="upload-status">
                            <div className="tiny-spinner" style={{ borderTopColor: "#333", border: "2px solid rgba(0,0,0,0.1)" }}></div>
                            {t("uploading")}
                        </span>}
                    </div>

                    {uploadError && (
                        <p className="context-upload-error">{uploadError}</p>
                    )}

                    {activeContext.files.length > 0 && (
                        <ul className="context-file-list">
                            {activeContext.files.map(file => {
                                const isExpired = file.provider === "gemini" && (Date.now() - file.uploadedAt > 48 * 60 * 60 * 1000);
                                return (
                                    <li key={file.id}>
                                        <span className={`file-name ${isExpired ? 'expired' : ''}`}>{file.name}</span>
                                        <span className="file-size">({formatFileSize(file.size)})</span>
                                        {file.provider !== pluginConfig.provider && (
                                            <span className="file-provider-mismatch" title={t("fileProviderMismatchWarning")}>⚠️</span>
                                        )}
                                        {isExpired && (
                                            <span className="file-expired-warning" title={t("fileExpiredWarning")}>⏱️</span>
                                        )}
                                        <button
                                            className="file-remove-btn"
                                            onClick={() => handleRemoveFile(file.id)}
                                            title={t("removeFile")}
                                        >
                                            ×
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <button
                        className="context-delete-btn"
                        onClick={handleDeleteContext}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <>
                            <div className="tiny-spinner"></div>
                            {t("deleting")}
                        </> : t("deleteContext")}
                    </button>
                </div>
            )}
        </div>
    );
}
