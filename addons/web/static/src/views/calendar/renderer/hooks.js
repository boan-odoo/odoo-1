/** @odoo-module **/

import { useAssets } from "@web/core/assets";
import { browser } from "@web/core/browser/browser";
import { usePopover } from "@web/core/popover/popover_hook";

const { onMounted, onPatched, onWillUnmount, useComponent, useRef } = owl.hooks;

export function useCalendarPopover(component) {
    const popovers = usePopover();
    let remove = null;
    function close() {
        if (remove) {
            remove();
            remove = null;
        }
    }
    return {
        close,
        open(target, props, popoverClass) {
            close();
            remove = popovers.add(target, component, props, {
                popoverClass,
                position: "right",
                onClose() {
                    remove = null;
                },
            });
        },
    };
}

export function useClickHandler(singleClickCb, doubleClickCb) {
    const component = useComponent();
    let clickTimeoutId = null;
    return function handle(...args) {
        if (clickTimeoutId) {
            doubleClickCb.call(component, ...args);
            browser.clearTimeout(clickTimeoutId);
            clickTimeoutId = null;
        } else {
            clickTimeoutId = browser.setTimeout(() => {
                singleClickCb.call(component, ...args);
                clickTimeoutId = null;
            }, 250);
        }
    };
}

export function useFullCalendar(refName, params) {
    const component = useComponent();
    const ref = useRef(refName);
    let instance = null;

    function boundParams() {
        const newParams = {};
        for (const key in params) {
            const value = params[key];
            newParams[key] = typeof value === "function" ? value.bind(component) : value;
        }
        return newParams;
    }

    useAssets({
        jsLibs: [
            "/web/static/lib/fullcalendar/interaction/main.js",
            "/web/static/lib/fullcalendar/daygrid/main.js",
            "/web/static/lib/fullcalendar/timegrid/main.js",
            "/web/static/lib/fullcalendar/list/main.js",
            "/web/static/lib/fullcalendar/core/main.js",
        ],
        cssLibs: [
            "/web/static/lib/fullcalendar/core/main.css",
            "/web/static/lib/fullcalendar/daygrid/main.css",
            "/web/static/lib/fullcalendar/timegrid/main.css",
            "/web/static/lib/fullcalendar/list/main.css",
        ],
    });

    onMounted(() => {
        try {
            instance = new FullCalendar.Calendar(ref.el, boundParams());
            instance.render();
        } catch (e) {
            throw new Error(`Cannot instantiate FullCalendar\n${e.message}`);
        }
    });
    onPatched(() => {
        instance.refetchEvents();
    });
    onWillUnmount(() => {
        instance.destroy();
    });

    return {
        get api() {
            return instance;
        },
        get el() {
            return ref.el;
        },
    };
}
