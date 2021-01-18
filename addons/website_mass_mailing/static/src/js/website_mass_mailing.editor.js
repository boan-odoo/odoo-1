odoo.define('website_mass_mailing.editor', function (require) {
'use strict';

var core = require('web.core');
var rpc = require('web.rpc');
const Dialog = require('web.Dialog');
var WysiwygMultizone = require('web_editor.wysiwyg.multizone');
var WysiwygTranslate = require('web_editor.wysiwyg.multizone.translate');
var options = require('web_editor.snippets.options');
var wUtils = require('website.utils');

const qweb = core.qweb;
var _t = core._t;



const mailingListSubscribeButton = {

    /**
     * @private
     */
    isMailingListExists(){
        const mailingListID = parseInt(this.$target.attr('data-list-id')) || this.defaultMailingID;
        if (mailingListID) {
            this.$target.attr("data-list-id", mailingListID);
            return;
        }
        const text =  _t('No mailing list exists in the database, Do you want to create a new mailing list!');
        Dialog.confirm(this, text, {
            title: _t("Warning!"),
            confirm_callback: () => {
                window.location.href = '/web#action=mass_mailing.action_view_mass_mailing_lists';
            },
            cancel_callback: () => {
                this.getParent()._onRemoveClick($.Event( "click" ));
            },
        });
    },
    /**
     * @private
     */
    async _renderMailingListButtons (uiFragment) {
        debugger;
        const mailingLists = await this._rpc({
            model: 'mailing.list',
            method: 'name_search',
            args: ['', [['is_public', '=', true]]],
            context: this.options.recordInfo.context,
        });
        if (mailingLists && mailingLists.length) {
            const selectEl = uiFragment.querySelector('we-select[data-name="mailing_list"]');
            // set default mailing list for we-select
            this.defaultMailingID = mailingLists[0][0];
            for (const mailingList of mailingLists) {
                const button = document.createElement('we-button');
                button.dataset.selectMailingList = mailingList[0];
                button.textContent = mailingList[1];
                selectEl.appendChild(button);
            }
        }
    },
}


options.registry.mailing_list_subscribe = options.Class.extend(mailingListSubscribeButton, {
    popup_template_id: "editor_new_mailing_list_subscribe_button",
    popup_title: _t("Add a Newsletter Subscribe Button"),

    //--------------------------------------------------------------------------
    // Options
    //--------------------------------------------------------------------------

    /**
     * Allows to select mailing list.
     *
     * @see this.selectClass for parameters
     */
    selectMailingList(previewMode, widgetValue, params) {
        this.$target.attr("data-list-id", widgetValue);
    },
    /**
     * @override
     */
    onBuilt: function () {
        this._super();
        this.isMailingListExists();
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     * @override
     */
    async _renderCustomXML(uiFragment) {
        await this._renderMailingListButtons(uiFragment);
    },
    /**
     * @private
     * @override
     */
    _computeWidgetState(methodName, params) {
        switch (methodName) {
            case 'selectMailingList':
                return parseInt(this.$target.attr('data-list-id')) || this.defaultMailingID;
        }
        return this._super(...arguments);
    },
});

options.registry.recaptchaSubscribe = options.Class.extend({
    xmlDependencies: ['/google_recaptcha/static/src/xml/recaptcha.xml'],

    /**
     * Toggle the recaptcha legal terms
     */
    toggleRecaptchaLegal: function (previewMode, value, params) {
        const recaptchaLegalEl = this.$target[0].querySelector('.o_recaptcha_legal_terms');
        if (recaptchaLegalEl) {
            recaptchaLegalEl.remove();
        } else {
            const template = document.createElement('template');
            template.innerHTML = qweb.render("google_recaptcha.recaptcha_legal_terms");
            this.$target[0].appendChild(template.content.firstElementChild);
        }
    },

    //----------------------------------------------------------------------
    // Private
    //----------------------------------------------------------------------

    /**
     * @override
     */
    _computeWidgetState: function (methodName, params) {
        switch (methodName) {
            case 'toggleRecaptchaLegal':
                return !this.$target[0].querySelector('.o_recaptcha_legal_terms') || '';
        }
        return this._super(...arguments);
    },
});

options.registry.newsletter_popup = options.registry.Popup.extend(mailingListSubscribeButton, {
    /**
     * @override
     */
    start: function () {
        this.selectorClass = '.o_newsletter_popup';
        this.$target.on('hidden.bs.modal.newsletter_popup_option', () => {
            this.trigger_up('snippet_option_visibility_update', {show: false});
        });
        return this._super(...arguments);
    },
    /**
     * @override
     */
    onTargetShow: function () {
        if (this.$target.attr("data-list-id")) {
            this.$target.modal('show');
            $(document.body).children('.modal-backdrop:last').addClass('d-none');
        }
        return this._refreshPublicWidgets();
    },
    /**
     * @override
     */
    cleanForSave: function () {
        var self = this;
        var content = this.$target.data('content');
        if (content) {
            this.trigger_up('get_clean_html', {
                $layout: $('<div/>').html(content),
                callback: function (html) {
                    self.$target.data('content', html);
                },
            });
        }
        this._super.apply(this, arguments);
    },
    /**
     * @override
     */
    destroy: function () {
        this.$target.off('.newsletter_popup_option');
        this.$target.find('.o_newsletter_content').empty();
        this._super.apply(this, arguments);
    },

    //--------------------------------------------------------------------------
    // Options
    //--------------------------------------------------------------------------

    /**
     * Allows to select mailing list.
     *
     * @see this.selectClass for parameters
     */
    selectMailingList(previewMode, widgetValue, params) {
        this.$target.attr("data-list-id", widgetValue);
        this.$target.removeData('content');
        return this._refreshPublicWidgets();
    },
    /**
     * @override
     */
    onBuilt: function () {
        this._super();
        this.isMailingListExists();
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     * @override
     */
    async _renderCustomXML(uiFragment) {
        await this._renderMailingListButtons(uiFragment);
    },
    /**
     * @private
     * @override
     */
    _computeWidgetState(methodName, params) {
        switch (methodName) {
            case 'selectMailingList':
                return parseInt(this.$target.attr('data-list-id')) || this.defaultMailingID;
        }
        return this._super(...arguments);
    },
});


WysiwygMultizone.include({

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _saveElement: function (outerHTML, recordInfo, editable) {
        var self = this;
        var defs = [this._super.apply(this, arguments)];
        var $popups = $(editable).find('.o_newsletter_popup');
        _.each($popups, function (popup) {
            var $popup = $(popup);
            var content = $popup.data('content');
            if (content) {
                defs.push(self._rpc({
                    route: '/website_mass_mailing/set_content',
                    params: {
                        'newsletter_id': parseInt($popup.attr('data-list-id')),
                        'content': content,
                    },
                }));
            }
        });
        return Promise.all(defs);
    },
});

WysiwygTranslate.include({
    /**
     * @override
     */
    start: function () {
        this.$target.on('click.newsletter_popup_option', '.o_edit_popup', function (ev) {
            alert(_t('Website popups can only be translated through mailing list configuration in the Email Marketing app.'));
        });
        this._super.apply(this, arguments);
    },
});

});
