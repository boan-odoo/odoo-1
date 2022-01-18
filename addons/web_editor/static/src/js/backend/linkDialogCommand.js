/** @odoo-module **/

import Wysiwyg from 'web_editor.wysiwyg'
import { registry } from '@web/core/registry'
import { HotkeyCommandItem } from '@web/core/commands/default_providers'

let lastWysiwygAndRange;

const commandProviderRegistry = registry.category("command_provider");
commandProviderRegistry.add("link dialog", {
    async provide() {
        let wysiwyg;
        let range;

        if (lastWysiwygAndRange) {
            [wysiwyg, range] = lastWysiwygAndRange;
        } else {
            wysiwyg = [...Wysiwyg.activeWysiwygs].find((wysiwyg) => {
                return wysiwyg.isSelectionInEditable();
            });
            if (wysiwyg) {
                const selection = wysiwyg && wysiwyg.odooEditor.document.getSelection();
                range = selection && selection.rangeCount && selection.getRangeAt(0);
            }
            if (range) {
                lastWysiwygAndRange = [wysiwyg, range];
            }
        }

        if (range) {
            let link = wysiwyg.getInSelection('a');
            const label = !link ? 'Create link' : 'Edit link';

            return [
                {
                    Component: HotkeyCommandItem,
                    action: () => {
                        const selection = wysiwyg.odooEditor.document.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);

                        wysiwyg.openLinkToolsFromSelection();
                    },
                    category: 'shortcut_conflict',
                    name: label,
                    props: { hotkey: 'control+k' },
                }
            ]
        } else {
            return [];
        }
    },
    onClose() {
        lastWysiwygAndRange = undefined;
    }
});
