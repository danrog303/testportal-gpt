import useGlobalSyncedState from "~hooks/use-global-synced-state";
import { createContext, type Context } from "~models/context";

export const PluginContextsKey = "testportal-gpt-contexts";
export const ActiveContextIdKey = "testportal-gpt-active-context-id";

export default function useContexts() {
    const [contexts, setContexts] = useGlobalSyncedState<Context[]>(PluginContextsKey, []);
    const [activeContextId, setActiveContextId] = useGlobalSyncedState<string | null>(ActiveContextIdKey, null);

    function getActiveContext(): Context | null {
        if (!activeContextId) return null;
        return contexts.find(c => c.id === activeContextId) || null;
    }

    function addContext(name: string): Context {
        const newContext = createContext(name);
        setContexts(prev => [...prev, newContext]);
        setActiveContextId(newContext.id);
        return newContext;
    }

    function updateContext(id: string, updates: Partial<Omit<Context, "id" | "createdAt">>): void {
        setContexts(prev => prev.map(c =>
            c.id === id
                ? { ...c, ...updates, updatedAt: Date.now() }
                : c
        ));
    }

    function deleteContext(id: string): void {
        setContexts(prev => prev.filter(c => c.id !== id));
        if (activeContextId === id) {
            setActiveContextId(null);
        }
    }

    function getContext(id: string): Context | null {
        return contexts.find(c => c.id === id) || null;
    }

    function setContextText(id: string, textContent: string): void {
        updateContext(id, { textContent });
    }

    function addFileToContext(contextId: string, file: Context["files"][0]): void {
        setContexts(prev => prev.map(c =>
            c.id === contextId
                ? { ...c, files: [...c.files, file], updatedAt: Date.now() }
                : c
        ));
    }

    function removeFileFromContext(contextId: string, fileId: string): void {
        const context = getContext(contextId);
        if (context) {
            updateContext(contextId, {
                files: context.files.filter(f => f.id !== fileId)
            });
        }
    }

    function setContextVectorStore(contextId: string, vectorStoreId: string | null): void {
        updateContext(contextId, { vectorStoreId });
    }

    return {
        contexts,
        activeContextId,
        setActiveContextId,
        getActiveContext,
        addContext,
        updateContext,
        deleteContext,
        getContext,
        setContextText,
        addFileToContext,
        removeFileFromContext,
        setContextVectorStore
    };
}
