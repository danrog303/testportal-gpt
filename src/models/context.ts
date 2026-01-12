/**
 * Represents a file uploaded to OpenAI for context.
 */
export interface ContextFile {
    /** Local unique identifier */
    id: string;
    /** Original filename */
    name: string;
    /** OpenAI file ID after upload */
    openaiFileId: string;
    /** File size in bytes */
    size: number;
    /** Timestamp when file was uploaded */
    uploadedAt: number;
}

/**
 * Represents a named context with text and file attachments.
 */
export interface Context {
    /** Unique identifier */
    id: string;

    /** User-defined name for the context */
    name: string;

    /** Text content to include in prompts */
    textContent: string;

    /** Files uploaded to OpenAI */
    files: ContextFile[];

    /** OpenAI vector store ID for file search */
    vectorStoreId: string | null;

    /** Timestamp when context was created */
    createdAt: number;

    /** Timestamp when context was last updated */
    updatedAt: number;
}

/**
 * Generates a unique ID for contexts and files.
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a new empty context with the given name.
 */
export function createContext(name: string): Context {
    const now = Date.now();
    return {
        id: generateId(),
        name,
        textContent: "",
        files: [],
        vectorStoreId: null,
        createdAt: now,
        updatedAt: now
    };
}
