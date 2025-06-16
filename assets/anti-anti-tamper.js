
/*
 * This script is injected into the TestPortal website if "anti-anti-tampering" feature is enabled in plugin config.
 * It overrides certain global functions to prevent the website from detecting tampering.
 * Those operations cannot be performed in the content script, because TestPortal uses a CSP that prevents inline scripts.
 */

(function() {
    console.log("[testportal-gpt] anti-anti-tampering script is running");
    window.logToServer = () => false;
    Object.defineProperty(document, 'hasFocus', {
        get: () => { throw new ReferenceError("antiTestportalFeature"); },
        configurable: true
    });
    window.addEventListener('error', () => true);
})();
