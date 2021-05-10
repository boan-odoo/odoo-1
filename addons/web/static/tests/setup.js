/** @odoo-module **/

import { browser } from "@web/core/browser/browser";
import { patchWithCleanup } from "@web/../tests/helpers/utils";
import { legacyProm } from "web.test_legacy";
import { registerCleanup } from "./helpers/cleanup";
import { prepareRegistriesWithCleanup, setTestOdooWithCleanup } from "./helpers/mock_env";

const { whenReady, loadFile } = owl.utils;

owl.config.enableTransitions = false;
owl.QWeb.dev = true;

function forceLocaleAndTimezoneWithCleanup() {
    const originalLocale = luxon.Settings.defaultLocale;
    luxon.Settings.defaultLocale = "en";
    const originalZoneName = luxon.Settings.defaultZoneName;
    luxon.Settings.defaultZoneName = "Europe/Brussels";
    registerCleanup(() => {
        luxon.Settings.defaultLocale = originalLocale;
        luxon.Settings.defaultZoneName = originalZoneName;
    });
}

function patchBrowserWithCleanup() {
    // patch addEventListner to automatically remove listeners bound (via browser.addEventListener)
    // during a test (e.g. during the deployment of a service)
    const originalAddEventListener = browser.addEventListener;
    const originalRemoveEventListener = browser.removeEventListener;
    patchWithCleanup(browser, {
        addEventListener() {
            originalAddEventListener(...arguments);
            registerCleanup(() => {
                originalRemoveEventListener(...arguments);
            });
        },
    });
}

export async function setupTests() {
    QUnit.testStart(() => {
        setTestOdooWithCleanup();
        prepareRegistriesWithCleanup();
        forceLocaleAndTimezoneWithCleanup();
        patchBrowserWithCleanup();
    });

    const templatesUrl = `/web/webclient/qweb/${new Date().getTime()}`;
    // TODO replace by `processTemplates` when the legacy system is removed
    let templates = await loadFile(templatesUrl);
    // as we currently have two qweb engines (owl and legacy), owl templates are
    // flagged with attribute `owl="1"`. The following lines removes the 'owl'
    // attribute from the templates, so that it doesn't appear in the DOM. For now,
    // we make the assumption that 'templates' only contains owl templates. We
    // might need at some point to handle the case where we have both owl and
    // legacy templates. At the end, we'll get rid of all this.
    const doc = new DOMParser().parseFromString(templates, "text/xml");
    const owlTemplates = [];
    for (let child of doc.querySelectorAll("templates > [owl]")) {
        child.removeAttribute("owl");
        owlTemplates.push(child.outerHTML);
    }
    templates = `<templates> ${owlTemplates.join("\n")} </templates>`;
    window.__ODOO_TEMPLATES__ = templates;
    await Promise.all([whenReady(), legacyProm]);
}
