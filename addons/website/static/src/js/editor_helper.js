/** @odoo-module */

import { loadWysiwyg } from 'web_editor.loader';
import websiteRootInstance from '../js/content/website_root_instance';

loadWysiwyg(['website.compiled_assets_wysiwyg']);

if (window.parent !== window) {
     // FIXME: Should be made more robust to ensure we're in edit mode
    window.websiteRootInstance = websiteRootInstance;
}
