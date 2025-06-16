export enum BrowserEnvType {
    ContentScript = 'content-script',
    BackgroundScript = 'background-script',
    PopupScript = 'popup-script',
    OptionsPage = 'options-page',
}

export default function useBrowserEnv(): BrowserEnvType {
    function isContentScript(): boolean {
        try {
            return typeof chrome !== 'undefined' &&
                typeof chrome.runtime !== 'undefined' &&
                typeof chrome.extension?.getViews !== 'function' &&
                typeof window !== 'undefined' &&
                window.location.protocol.startsWith('http');
        } catch {
            return false;
        }
    }

    function isPopupScript(): boolean {
        try {
            if (typeof chrome?.extension?.getViews === 'function') {
                const views = chrome.extension.getViews({ type: 'popup' });
                return views.some(view => view === window);
            }
            return false;
        } catch {
            return false;
        }
    }

    function isBackgroundScript(): boolean {
        try {
            if (typeof chrome?.extension?.getBackgroundPage === 'function') {
                const bg = chrome.extension.getBackgroundPage();
                return bg === window;
            }
            return false;
        } catch {
            return false;
        }
    }

    function isOptionsPage(): boolean {
        try {
            if (typeof chrome?.extension?.getViews === 'function') {
                const views = chrome.extension.getViews({ type: 'tab' });
                // Opcje są ładowane jako 'tab' (zwykła karta rozszerzenia)
                return views.some(view => view === window) && window.location.pathname.includes('options');
            }
            return false;
        } catch {
            return false;
        }
    }

    if (isContentScript()) return BrowserEnvType.ContentScript;
    if (isPopupScript()) return BrowserEnvType.PopupScript;
    if (isBackgroundScript()) return BrowserEnvType.BackgroundScript;
    if (isOptionsPage()) return BrowserEnvType.OptionsPage;

    throw new Error('Unable to determine browser environment. Please check if you are running this code in a supported context.');
}
