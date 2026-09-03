import { sendToContentScript } from "@plasmohq/messaging"

export const handler = async (req, res) => {
}

function detectImageMimeType(bytes: Uint8Array): string {
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return "image/png";
    }
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return "image/jpeg";
    }
    // GIF: 47 49 46 38
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return "image/gif";
    }
    // WebP: RIFF .... WEBP
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return "image/webp";
    }
    return "image/png";
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "FETCH_IMAGE") {
        fetch(request.url)
            .then(async response => {
                const buffer = await response.arrayBuffer();
                const bytes = new Uint8Array(buffer);

                let mimeType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
                if (!mimeType || mimeType.includes("octet-stream") || !mimeType.startsWith("image/")) {
                    mimeType = detectImageMimeType(bytes);
                }

                const blob = new Blob([buffer], { type: mimeType });
                const reader = new FileReader();
                reader.onloadend = () => {
                    sendResponse({ data: reader.result, success: true });
                };
                reader.onerror = () => {
                    sendResponse({ success: false, error: "Failed to read blob" });
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                sendResponse({ success: false, error: error.toString() });
            });

        return true;
    }
});
