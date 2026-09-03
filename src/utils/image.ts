/**
 * Fetches an image via the background service worker and converts it to a base64 Data URL.
 * Bypasses CORS and authentication barriers on exam sites like Moodle and Testportal.
 */
/**
 * Normalizes a base64 Data URL to ensure it has a valid image MIME type (e.g. image/png, image/jpeg).
 * If the MIME type is application/octet-stream or missing, detects the real type from magic bytes in base64.
 */
export function normalizeImageDataUrl(dataUrl: string): string {
    if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;

    const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
    if (!match) return dataUrl;

    const currentMime = (match[1] || "").toLowerCase();
    const isBase64 = match[2] === ";base64";
    const data = match[3];

    if (!currentMime || currentMime.includes("octet-stream") || !currentMime.startsWith("image/")) {
        let detectedMime = "image/png";
        if (data.startsWith("/9j/")) {
            detectedMime = "image/jpeg";
        } else if (data.startsWith("R0lGOD")) {
            detectedMime = "image/gif";
        } else if (data.startsWith("UklGR")) {
            detectedMime = "image/webp";
        } else if (data.startsWith("iVBORw0KGgo")) {
            detectedMime = "image/png";
        }
        return `data:${detectedMime}${isBase64 ? ";base64" : ""},${data}`;
    }

    return dataUrl;
}

export async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
    try {
        const response = (await Promise.race([
            chrome.runtime.sendMessage({
                type: "FETCH_IMAGE",
                url: imageUrl
            }),
            new Promise((_, reject) =>
                setTimeout(
                    () =>
                        reject(
                            new Error(
                                "Timeout: The extension background service worker did not respond. Try refreshing the page."
                            )
                        ),
                    15000
                )
            )
        ])) as any;

        if (response && response.success) {
            return normalizeImageDataUrl(response.data);
        } else {
            console.error("Failed to fetch image via background script:", response?.error);
            throw new Error(response?.error || "Unknown error fetching image");
        }
    } catch (e) {
        console.error("Error sending message to background script:", e);
        throw e;
    }
}

