export interface SSEMessage {
    event?: string;
    data: any;
    rawData: string;
}

/**
 * Reads a Server-Sent Events (SSE) stream from a fetch Response, parsing each event block
 * and invoking the `onMessage` callback. Handles stream chunk buffering, comment lines,
 * and cancellation via AbortSignal.
 */
export async function readSSEStream(
    response: Response,
    onMessage: (msg: SSEMessage) => void,
    signal?: AbortSignal
): Promise<void> {
    if (!response.body) {
        throw new Error("Response body is empty or unavailable for streaming.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
        while (true) {
            if (signal?.aborted) {
                await reader.cancel();
                return;
            }

            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });

            // SSE messages are separated by double newlines (\n\n or \r\n\r\n)
            const blocks = buffer.split(/\r?\n\r?\n/);
            // The last item in blocks may be an incomplete message block
            buffer = blocks.pop() ?? "";

            for (const block of blocks) {
                if (signal?.aborted) {
                    await reader.cancel();
                    return;
                }

                const lines = block.split(/\r?\n/);
                let eventType: string | undefined;
                const dataLines: string[] = [];

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith(":")) {
                        // Skip empty lines or SSE comments (heartbeats)
                        continue;
                    }

                    if (trimmed.startsWith("event:")) {
                        eventType = trimmed.substring(6).trim();
                    } else if (trimmed.startsWith("data:")) {
                        dataLines.push(trimmed.substring(5).trim());
                    }
                }

                if (dataLines.length === 0) {
                    continue;
                }

                const rawData = dataLines.join("\n");
                if (rawData === "[DONE]") {
                    return;
                }

                let parsedData: any = rawData;
                try {
                    parsedData = JSON.parse(rawData);
                } catch {
                    // Raw string payload
                }

                onMessage({
                    event: eventType,
                    data: parsedData,
                    rawData
                });
            }
        }

        // Flush any remaining buffer if it contains a complete event
        if (buffer.trim()) {
            const lines = buffer.split(/\r?\n/);
            let eventType: string | undefined;
            const dataLines: string[] = [];

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("event:")) {
                    eventType = trimmed.substring(6).trim();
                } else if (trimmed.startsWith("data:")) {
                    dataLines.push(trimmed.substring(5).trim());
                }
            }

            if (dataLines.length > 0) {
                const rawData = dataLines.join("\n");
                if (rawData !== "[DONE]") {
                    let parsedData: any = rawData;
                    try {
                        parsedData = JSON.parse(rawData);
                    } catch {
                        // Raw string
                    }
                    onMessage({
                        event: eventType,
                        data: parsedData,
                        rawData
                    });
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

