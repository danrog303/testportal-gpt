import { sendToContentScript } from "@plasmohq/messaging"

export const handler = async (req, res) => {
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "FETCH_IMAGE") {
        fetch(request.url)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    sendResponse({ data: reader.result, success: true });
                };
                reader.onerror = () => {
                    sendResponse({ success: false, error: "Failed to read blob" });
                }
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                sendResponse({ success: false, error: error.toString() });
            });

        return true;
    }
});
