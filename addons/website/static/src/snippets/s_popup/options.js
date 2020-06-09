odoo.define('website.s_popup_options', function (require) {
'use strict';

const snippetOptions = require('web_editor.snippets.options');

snippetOptions.registry.SnippetPopup = snippetOptions.SnippetOptionWidget.extend({
    /**
     * @override
     */
    start: function () {
        // Note: the link are excluded here so that internal modal buttons do
        // not close the popup as we want to allow edition of those buttons.
        this.$target.find('.js_close_popup:not(a, .btn)').on('click', ev => {
            ev.stopPropagation();
            this.onTargetHide();
            this.trigger_up('snippet_option_visibility_update', {show: false});
        });
        return this._super(...arguments);
    },
    /**
     * @override
     */
    onBuilt: function () {
        this._assignUniqueID();
    },
    /**
     * @override
     */
    onClone: function () {
        this._assignUniqueID();
    },
    /**
     * @override
     */
    onTargetShow: async function () {
        this.$target.removeClass('d-none');
    },
    /**
     * @override
     */
    onTargetHide: async function () {
        this.$target.addClass('d-none');
    },
    //--------------------------------------------------------------------------
    // Options
    //--------------------------------------------------------------------------

    /**
     * Moves the snippet in footer to be common to all pages
     * or inside wrap to be on one page only
     *
     * @see this.selectClass for parameters
     */
    moveBlock: function (previewMode, widgetValue, params) {
        const $container = $(widgetValue === 'moveToFooter' ? 'footer' : 'main');
        this.$target.closest('.s_popup').prependTo($container.find('.oe_structure:o_editable').first());
    },
    /**
     * Switch layout from modal <--> a sticky div
     *
     * @see this.selectClass for parameters
     */
    setLayout: async function (previewMode, widgetValue, params) {
        const isModal = widgetValue === 'modal';
        const isTop = widgetValue === 'fixedTop';
        await this.wysiwyg.execBatch(async () => {
            await this.editor.execCommand(isModal ? 'dom.removeClass' : 'dom.addClass', {
                domNode: this.$target[0],
                class: 's_popup_fixed',
            });
            await this.editor.execCommand(isTop ? 'dom.removeClass' : 'dom.addClass', {
                domNode: this.$target[0],
                class: 's_popup_fixed_top',
            });
            await this.editor.execCommand(isModal ? 'dom.addClass' : 'dom.removeClass', {
                domNode: this.$target[0],
                class: ['s_popup_center', 'modal'],
            });
            await this.editor.execCommand(isModal ? 'dom.addClass' : 'dom.removeClass', {
                domNode: this.$target.find('.s_popup_frame')[0],
                class: 'modal',
            });
            await this.editor.execCommand(isModal ? 'dom.addClass' : 'dom.removeClass', {
                domNode: this.$target.find('.s_popup_content')[0],
                class: 'modal-content',
            });
        });
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Creates a unique ID.
     *
     * @private
     */
    _assignUniqueID: function () {
        this.$target.closest('.s_popup').attr('id', 'sPopup' + Date.now());
    },
    /**
     * @override
     */
    _computeWidgetState: function (methodName, params) {
        switch (methodName) {
            case 'moveBlock':
                return this.$target.closest('footer').length ? 'moveToFooter' : 'moveToBody';
            case 'setLayout':
                if (this.$target.hasClass('s_popup_center')) {
                    return 'modal';
                } else if (this.$target.hasClass('s_popup_fixed_top')) {
                    return 'fixedTop';
                }
                return 'fixedBottom';
        }
        return this._super(...arguments);
    },
});

snippetOptions.registry.PopupContent = snippetOptions.SnippetOptionWidget.extend({

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Enable bg-color only if "centered AND full-size".
     * Visibility according to the size is managed by data-dependencies.
     *
     * @override
     */
    async _computeWidgetVisibility(widgetName, params) {
        if (widgetName === 'popup_content_colorpicker_opt') {
            return this.$target.closest('.s_popup_main').hasClass('s_popup_center');
        }
        return this._super(...arguments);
    },
});
});
