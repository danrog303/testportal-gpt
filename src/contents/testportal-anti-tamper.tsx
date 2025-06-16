import type { PlasmoCSConfig } from "plasmo"
import { BaseStorage, Storage } from "@plasmohq/storage"
import { PluginConfigKeys } from "~hooks/use-plugin-config";

const pluginStorage: BaseStorage = new Storage();
export const config: PlasmoCSConfig = {
    matches: [
        "https://testportal.pl/*",
        "https://testportal.net/*",
        "https://*.testportal.pl/*",
        "https://*.testportal.net/*",
    ]
};

// Kudos to github.com/alszolowicz/anti-testportal for concept and inspiration.
function applyAntiAntiTampering() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('assets/anti-anti-tamper.js');
    document.documentElement.appendChild(script);
    script.onload = () => script.remove();
}

window.addEventListener("load", async () => {
    const enableAntiAntiTampering = await pluginStorage.get(PluginConfigKeys.TestPortalAntiAntiTampering);
    if (enableAntiAntiTampering) {
        applyAntiAntiTampering();
    }
})
