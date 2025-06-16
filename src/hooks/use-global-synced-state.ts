import React, { useEffect, useRef, useState } from "react";
import { Storage } from "@plasmohq/storage"
import useAsyncEffect from "use-async-effect"
import { EventEmitter } from "events"
import { sendToContentScript } from "@plasmohq/messaging";
import useBrowserEnv, { BrowserEnvType } from "~hooks/use-browser-env";
import { debounce } from "lodash";

export const MSG_GLOBAL_STATE_CHANGE = "testportal-global-state-change";

const pluginStorage = new Storage();
const stateMap = new Map<string, any>();
const emitter = new EventEmitter();
export const stateBus = {
    get: <T>(key: string): T | undefined => stateMap.get(key),
    set: <T>(key: string, value: T) => {
        stateMap.set(key, value)
        emitter.emit(key, value)
    },
    subscribe: <T>(key: string, callback: (value: T) => void) => {
        emitter.on(key, callback)
        return () => emitter.off(key, callback)
    }
}

/*
 * Custom React hook to manage a global state variable that is synchronized with persistent plugin storage.
 */
export default function useSyncedState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(defaultValue);
    const browserEnv: BrowserEnvType = useBrowserEnv();

    const isInitialized = useRef<boolean>(false);
    const initialMessageSkipped = useRef<boolean>(false);

    // Load from plugin storage when the component mounts.
    useAsyncEffect(async () => {
        const stored = await pluginStorage.get<T>(key);
        if (stored !== undefined) {
            setValue(stored);
            stateBus.set(key, stored);
        }
        isInitialized.current = true;
    }, [])

    // Sync updates to plugin storage.
    useAsyncEffect(async () => {
        if (!isInitialized.current) return;
        await pluginStorage.set(key, value)
    }, [key, value])

    // Send a notification to the content script when the value changes.
    // This communication is only done for PopupScript->ContentScript.
    // The message is debounced to avoid flooding the content script with messages.
    // if (browserEnv === BrowserEnvType.PopupScript) {
    //     useEffect(() => {
    //         if (!isInitialized.current) return;
    //
    //         if (!initialMessageSkipped.current) {
    //             initialMessageSkipped.current = true;
    //             return
    //         }
    //
    //         // Debounce the message sending to avoid too many messages in a short time.
    //         // Use a longer debounce time for string values to avoid flooding the content script.
    //         const debounceTime = typeof value === "string" ? 500 : 1;
    //
    //         const tabs = await chrome.tabs.query({
    //             url: [
    //                 "*://*.testportal.net/*",
    //                 "*://*.testportal.pl/*"
    //             ]
    //         });
    //
    //         const timeoutId = setTimeout(async () => {
    //             for (const tab of tabs) {
    //                 if (tab.id != null) {
    //                     try {
    //                         await sendToContentScript({
    //                             name: MSG_GLOBAL_STATE_CHANGE,
    //                             tabId: tab.id,
    //                             body: {
    //                                 field: key,
    //                                 newValue: value
    //                             }
    //                         })
    //                     } catch (err) {
    //                         console.warn(`Failed to send state upgrade to tabId=${tab.id}`, err)
    //                     }
    //                 }
    //             }
    //         }, debounceTime);
    //         return () => clearTimeout(timeoutId);
    //     }, [key, value]);
    // }

    // Subscribe to changes in the global state bus for this key.
    useEffect(() => {
        const unsubscribe = stateBus.subscribe<T>(key, (newVal) => {
            if (!isInitialized.current) return;
            setValue(newVal)
        })
        return () => {
            unsubscribe()
        }
    }, [key]);

    // Function to set the shared value in the global state bus.
    const setSharedValue: React.Dispatch<React.SetStateAction<T>> = (update) => {
        if (!isInitialized.current) return;
        const newValue = typeof update === "function" ? (update as any)(stateBus.get<T>(key)) : update
        stateBus.set(key, newValue)
    }

    return [value, setSharedValue]
}