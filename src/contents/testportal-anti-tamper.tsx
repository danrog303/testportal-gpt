import type { PlasmoCSConfig } from "plasmo"
import { BaseStorage, Storage } from "@plasmohq/storage"
import { PluginConfigKey, type PluginConfig } from "~hooks/use-plugin-config";

const pluginStorage: BaseStorage = new Storage();
export const config: PlasmoCSConfig = {
    matches: [
        "https://testportal.pl/*",
        "https://testportal.net/*",
        "https://*.testportal.pl/*",
        "https://*.testportal.net/*",
        "https://testportal.com/*",
        "https://*.testportal.com/*",
        "https://teams.microsoft.com/*"
    ],
    all_frames: true
};

// Kudos to github.com/alszolowicz/anti-testportal for concept and inspiration.
function applyAntiAntiTampering() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('assets/anti-anti-tamper.js');
    document.documentElement.appendChild(script);
    script.onload = () => script.remove();
}

window.addEventListener("load", async () => {
    const config = await pluginStorage.get<PluginConfig>(PluginConfigKey);
    const enableAntiAntiTampering = config?.antiAntiTampering ?? false;

    if (enableAntiAntiTampering) {
        console.log("[testportal-gpt] Applying anti-anti-tampering");
        applyAntiAntiTampering();
    } else {
        console.log("[testportal-gpt] Anti-anti-tampering is not enabled");
    }
})

export default () => null;
