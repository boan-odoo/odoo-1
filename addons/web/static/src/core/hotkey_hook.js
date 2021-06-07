/** @odoo-module */

import { useService } from "./service_hook";
import { useEffect } from "./effect_hook";

/**
 * This hook will register/unregister the given registration
 * when the caller component will mount/unmount.
 *
 * @param {string} hotkey
 * @param {()=>void} callback
 * @param {Object} options additional options
 * @param {boolean} [options.altIsOptional=false]
 *  allow registration to perform even without pressing the ALT key
 * @param {boolean} [options.allowRepeat=false]
 *  allow registration to perform multiple times when hotkey is held down
 * @param {boolean} [options.global=false]
 *  allow registration to perform no matter the UI active element
 */
export function useHotkey(hotkey, callback, options = {}) {
    const hotkeyService = useService("hotkey");
    useEffect(
        () => hotkeyService.add(hotkey, callback, options),
        () => []
    );
}
