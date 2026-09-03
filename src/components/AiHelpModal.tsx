import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { t } from "~i18n";

export interface AiHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStop?: () => void;
    onRetry?: () => void;
    isStreaming: boolean;
    streamedText: string;
    error: string | null;
    providerName?: string;
    modelName?: string;
}

/**
 * A lightweight, safe Markdown renderer for structured AI answers and explanations.
 */
function MarkdownRenderer({ content, isStreaming }: { content: string; isStreaming: boolean }) {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let listItems: string[] = [];
    let listType: "ul" | null = null;
    let lastOrderedNum = 0;
    let linesSinceLastOrdered = 999;

    function flushList() {
        if (!listType || listItems.length === 0) return;
        const items = [...listItems];
        elements.push(
            <ul key={`ul-${elements.length}`} style={{ margin: "6px 0 10px 20px", padding: 0, listStyleType: "disc", color: "#334155" }}>
                {items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>
                        {formatInline(item)}
                    </li>
                ))}
            </ul>
        );
        listItems = [];
        listType = null;
    }

    function formatInline(text: string): React.ReactNode[] {
        // Handle inline code `code` and bold **text**
        const parts: React.ReactNode[] = [];
        const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
        let lastIdx = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIdx) {
                parts.push(text.substring(lastIdx, match.index));
            }
            const token = match[0];
            if (token.startsWith("`") && token.endsWith("`")) {
                parts.push(
                    <code
                        key={`code-${parts.length}`}
                        style={{
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontFamily: "monospace",
                            fontSize: "13px",
                            color: "#059669"
                        }}
                    >
                        {token.slice(1, -1)}
                    </code>
                );
            } else if (token.startsWith("**") && token.endsWith("**")) {
                parts.push(
                    <strong key={`bold-${parts.length}`} style={{ color: "#0f172a", fontWeight: 700 }}>
                        {token.slice(2, -2)}
                    </strong>
                );
            } else if (token.startsWith("*") && token.endsWith("*")) {
                parts.push(
                    <em key={`italic-${parts.length}`} style={{ color: "#475569" }}>
                        {token.slice(1, -1)}
                    </em>
                );
            }
            lastIdx = regex.lastIndex;
        }

        if (lastIdx < text.length) {
            parts.push(text.substring(lastIdx));
        }

        return parts;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code block toggle
        if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
                elements.push(
                    <pre
                        key={`codeblock-${elements.length}`}
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            overflowX: "auto",
                            fontSize: "13px",
                            fontFamily: "monospace",
                            color: "#0f172a",
                            margin: "12px 0"
                        }}
                    >
                        <code>{codeBlockContent.join("\n")}</code>
                    </pre>
                );
                codeBlockContent = [];
                inCodeBlock = false;
            } else {
                flushList();
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // Headings
        if (line.startsWith("### ")) {
            flushList();
            lastOrderedNum = 0;
            linesSinceLastOrdered = 999;
            const headingText = line.substring(4).trim();
            const isAnswerHeading =
                headingText.includes("Correct Answer") ||
                headingText.includes("Recommended Answer") ||
                headingText.includes("Poprawna odpowiedź") ||
                headingText.includes("Rekomendowana odpowiedź");
            elements.push(
                <h3
                    key={`h3-${elements.length}`}
                    style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        margin: "16px 0 8px 0",
                        color: isAnswerHeading ? "#059669" : "#0f172a",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        letterSpacing: "-0.2px"
                    }}
                >
                    {headingText}
                </h3>
            );
            continue;
        }

        if (line.startsWith("## ")) {
            flushList();
            lastOrderedNum = 0;
            linesSinceLastOrdered = 999;
            elements.push(
                <h2
                    key={`h2-${elements.length}`}
                    style={{
                        fontSize: "17px",
                        fontWeight: 700,
                        margin: "18px 0 10px 0",
                        color: "#0f172a",
                        borderBottom: "1px solid #e2e8f0",
                        paddingBottom: "4px"
                    }}
                >
                    {line.substring(3).trim()}
                </h2>
            );
            continue;
        }

        // Unordered list item
        if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            lastOrderedNum = 0;
            linesSinceLastOrdered = 999;
            if (listType !== "ul") {
                flushList();
                listType = "ul";
            }
            listItems.push(line.trim().substring(2).trim());
            continue;
        }

        // Ordered list item
        const orderedMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
        if (orderedMatch) {
            flushList();
            const parsedNum = parseInt(orderedMatch[1], 10);
            let numToUse = parsedNum;
            if (parsedNum === 1 && lastOrderedNum >= 1 && linesSinceLastOrdered <= 3) {
                numToUse = lastOrderedNum + 1;
            }
            lastOrderedNum = numToUse;
            linesSinceLastOrdered = 0;

            elements.push(
                <div
                    key={`ordered-${elements.length}`}
                    style={{
                        display: "flex",
                        gap: "8px",
                        margin: "12px 0 4px 0",
                        alignItems: "baseline"
                    }}
                >
                    <span
                        style={{
                            fontWeight: 700,
                            color: "#059669",
                            fontSize: "14px",
                            minWidth: "18px"
                        }}
                    >
                        {numToUse}.
                    </span>
                    <div
                        style={{
                            color: "#1e293b",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            flex: 1
                        }}
                    >
                        {formatInline(orderedMatch[2].trim())}
                    </div>
                </div>
            );
            continue;
        }

        // Regular paragraph or empty line
        linesSinceLastOrdered++;
        flushList();
        if (line.trim()) {
            elements.push(
                <p
                    key={`p-${elements.length}`}
                    style={{
                        margin: "6px 0",
                        color: "#334155",
                        fontSize: "14px",
                        lineHeight: 1.6
                    }}
                >
                    {formatInline(line)}
                </p>
            );
        }
    }

    flushList();

    if (inCodeBlock && codeBlockContent.length > 0) {
        elements.push(
            <pre
                key={`codeblock-dangling`}
                style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    overflowX: "auto",
                    fontSize: "13px",
                    fontFamily: "monospace",
                    color: "#0f172a",
                    margin: "12px 0"
                }}
            >
                <code>{codeBlockContent.join("\n")}</code>
            </pre>
        );
    }

    return (
        <div>
            {elements}
            {isStreaming && (
                <span
                    style={{
                        display: "inline-block",
                        width: "8px",
                        height: "16px",
                        backgroundColor: "#059669",
                        marginLeft: "4px",
                        verticalAlign: "middle",
                        animation: "aiModalBlink 0.9s infinite ease-in-out"
                    }}
                />
            )}
        </div>
    );
}

export const AiHelpModal: React.FC<AiHelpModalProps> = ({
    isOpen,
    onClose,
    onStop,
    onRetry,
    isStreaming,
    streamedText,
    error,
    providerName,
    modelName
}) => {
    const contentEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll as text streams in
    useEffect(() => {
        if (isStreaming) {
            contentEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [streamedText, isStreaming]);

    // Handle Escape key to close modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 99999999,
                padding: "20px",
                boxSizing: "border-box",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}
            onClick={e => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <style>
                {`
                @keyframes aiModalBlink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes aiModalPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                }
                `}
            </style>

            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "680px",
                    maxHeight: "85vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05)",
                    overflow: "hidden",
                    color: "#1e293b",
                    boxSizing: "border-box"
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "#f8fafc"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    color: "#0f172a"
                                }}
                            >
                                {t("aiHelpTitle")}
                            </h2>
                            {(providerName || modelName) && (
                                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                    {providerName && <span style={{ color: "#64748b", fontWeight: 500 }}>{providerName}</span>}
                                    {providerName && modelName && <span style={{ margin: "0 6px", color: "#cbd5e1" }}>•</span>}
                                    {modelName && <span style={{ color: "#475569" }}>{modelName}</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                            onClick={onClose}
                            style={{
                                background: "#f1f5f9",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                color: "#64748b",
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "14px",
                                transition: "all 0.2s ease"
                            }}
                            title={t("close")}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div
                    style={{
                        padding: "20px",
                        overflowY: "auto",
                        flex: 1,
                        backgroundColor: "#ffffff",
                        boxSizing: "border-box"
                    }}
                >
                    {error ? (
                        <div
                            style={{
                                padding: "16px",
                                borderRadius: "10px",
                                backgroundColor: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#991b1b",
                                fontSize: "13px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px"
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                                <span>{error}</span>
                            </div>
                            {onRetry && (
                                <div>
                                    <button
                                        onClick={onRetry}
                                        style={{
                                            background: "#fee2e2",
                                            border: "1px solid #fca5a5",
                                            color: "#991b1b",
                                            borderRadius: "6px",
                                            padding: "6px 14px",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                            fontWeight: 600
                                        }}
                                    >
                                        {t("retry")}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : !streamedText && isStreaming ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "40px 20px",
                                color: "#64748b",
                                gap: "12px"
                            }}
                        >
                            <div
                                style={{
                                    width: "28px",
                                    height: "28px",
                                    border: "3px solid #e2e8f0",
                                    borderTopColor: "#059669",
                                    borderRadius: "50%",
                                    animation: "spin 0.8s linear infinite"
                                }}
                            />
                            <span style={{ fontSize: "13px" }}>{t("aiHelpThinking")}</span>
                        </div>
                    ) : (
                        <div>
                            <MarkdownRenderer content={streamedText} isStreaming={isStreaming} />
                            <div ref={contentEndRef} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "12px 20px",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        backgroundColor: "#f8fafc"
                    }}
                >
                    <div style={{ display: "flex", gap: "8px" }}>
                        {isStreaming && onStop && (
                            <button
                                onClick={onStop}
                                style={{
                                    background: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    color: "#dc2626",
                                    padding: "6px 14px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}
                            >
                                {t("aiHelpStop")}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                padding: "6px 14px",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer"
                            }}
                        >
                            {t("close")}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

