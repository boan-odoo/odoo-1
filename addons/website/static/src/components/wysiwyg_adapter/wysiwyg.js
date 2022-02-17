/** @odoo-module */

import { ComponentAdapter } from 'web.OwlCompatibility';
import { _t } from "@web/core/l10n/translation";

const { onWillStart } = owl;


export class WysiwygAdapterComponent extends ComponentAdapter {
    setup() {
       const options = this.props.options || {};
       this.iframe = this.props.iframe;

       this.oeStructureSelector = '#wrapwrap .oe_structure[data-oe-xpath][data-oe-id]';
       this.oeFieldSelector = '#wrapwrap [data-oe-field]';
       this.oeCoverSelector = '#wrapwrap .s_cover[data-res-model], #wrapwrap .o_record_cover_container[data-res-model]';
       if (options.savableSelector) {
           this.savableSelector = options.savableSelector;
       } else {
           this.savableSelector = `${this.oeStructureSelector}, ${this.oeFieldSelector}, ${this.oeCoverSelector}`;
       }
       onWillStart(() => {
           this.editable.classList.add('o_editable');
           this.editableFromEditorMenu(this.$editable).addClass('o_editable');
           debugger;
           this._addEditorMessages();
       });
       super.setup();
    }

    _trigger_up(event) {
        console.log(event);
        super._trigger_up(...arguments);
    }
     /**
     * Returns the editable areas on the page.
     *
     * @param {DOM} $wrapwrap
     * @returns {jQuery}
     */
    editableFromEditorMenu($wrapwrap) {
        return $wrapwrap.find('[data-oe-model]')
            .not('.o_not_editable')
            .filter(function () {
                var $parent = $(this).closest('.o_editable, .o_not_editable');
                return !$parent.length || $parent.hasClass('o_editable');
            })
            .not('link, script')
            .not('[data-oe-readonly]')
            .not('img[data-oe-field="arch"], br[data-oe-field="arch"], input[data-oe-field="arch"]')
            .not('.oe_snippet_editor')
            .not('hr, br, input, textarea')
            .add('.o_editable');
    }

    /**
     * Adds automatic editor messages on drag&drop zone elements.
     *
     * @private
     */
    _addEditorMessages() {
        this.$editorMessageElements = this.$editable
            .not('[data-editor-message]')
            .attr('data-editor-message', _t('DRAG BUILDING BLOCKS HERE'));
        this.$editable.filter(':empty').attr('contenteditable', false);
    }

    get widgetArgs() {
        return [this._wysiwygParams];
    }

    get _wysiwygParams() {
        const context = this.props.context;
        return {
            snippets: 'website.snippets',
            recordInfo: {
                context: context,
                data_res_model: 'website',
                data_res_id: context.website_id,
            },
            editable: this.$editable,
            enableWebsite: true,
            discardButton: true,
            saveButton: true,
            devicePreview: true,
            websiteIframe: true,
            savableSelector: this.savableSelector,
            isRootEditable: false,
            controlHistoryFromDocument: true,
            getContentEditableAreas: this._getContentEditableAreas.bind(this),
            document: this.iframe.contentDocument,
        };
    }

    get editable() {
        return this.iframe.el.contentDocument.getElementById('wrapwrap');
    }
    get $editable() {
        return this.iframe.el.contentWindow.$(this.editable);
    }

    _getContentEditableAreas() {
        const savableElements = this.iframe.el.contentDocument.querySelectorAll('input, [data-oe-readonly],[data-oe-type="monetary"],[data-oe-many2one-id], [data-oe-field="arch"]:empty');
        return Array.from(savableElements).filter(element => !element.closest('.o_not_editable'));
    }
}
