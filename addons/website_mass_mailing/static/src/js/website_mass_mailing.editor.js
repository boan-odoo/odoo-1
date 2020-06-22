odoo.define('website_mass_mailing.editor', function (require) {
'use strict';

var core = require('web.core');
var rpc = require('web.rpc');
var WysiwygMultizone = require('web_editor.wysiwyg.multizone');
var options = require('web_editor.snippets.options');
var wUtils = require('website.utils');

const qweb = core.qweb;
var _t = core._t;


options.registry.mailing_list_subscribe = options.Class.extend({

    //--------------------------------------------------------------------------
    // Options
    //--------------------------------------------------------------------------

    /**
     * Allows to select mailing list.
     *
     * @see this.selectClass for parameters
     */
    select_mailing_list: function (previewMode, value) {
        var self = this;
        var def = wUtils.prompt({
            'id': this.popup_template_id,
            'window_title': this.popup_title,
            'select': _t("Newsletter"),
            'init': function (field, dialog) {
                return rpc.query({
                    model: 'mailing.list',
                    method: 'name_search',
                    args: ['', [['is_public', '=', true]]],
                    context: self.options.recordInfo.context,
                }).then(function (data) {
                    $(dialog).find('.btn-primary').prop('disabled', !data.length);
                    var list_id = self.$target.attr("data-list-id");
                    $(dialog).on('show.bs.modal', function () {
                        if (list_id !== "0"){
                            $(dialog).find('select').val(list_id);
                        };
                    });
                    return data;
                });
            },
        });
        def.then(function (result) {
            self.$target.attr("data-list-id", result.val);
        });
        return def;
    },
    /**
     * @override
     */
    onBuilt: function () {
        var self = this;
        this._super();
        this.select_mailing_list('click').guardedCatch(function () {
            self.getParent()._onRemoveClick($.Event( "click" ));
        });
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

options.registry.newsletter_popup = options.Class.extend({
    /**
     * @override
     */
    start: function () {
        this.$target.on('hidden.bs.modal.newsletter_popup_option', () => {
            this.trigger_up('snippet_option_visibility_update', {show: false});
        });
        return this._super(...arguments);
    },
    /**
     * @override
     */
    onTargetShow: function () {
        // Open the modal
        this.$target.find('.modal').modal('show');
        $(document.body).children('.modal-backdrop:last').addClass('d-none');
    },
    /**
     * @override
     */
    onTargetHide: function () {
        // Close the modal
        const $modal = this.$('.modal');
        if ($modal.length && $modal.is('.modal_shown')) {
            $modal.modal('hide');
        }
    },
    _renderCustomXML: function (uiFragment) {
        this._getMailingListButtons().then((mailingLists) => {
            this.mailingLists = mailingLists;
            const selectEl = uiFragment.querySelector('we-select[data-name="mailing_list"] we-select-menu');
            if (this.mailingLists.length && selectEl) {
                this.mailingLists.forEach( option => selectEl.append(option.cloneNode(true)));
            }
        });
    },
    _getMailingListButtons: function () {
        return rpc.query({
            model: 'mailing.list',
            method: 'name_search',
            args: ['', [['is_public', '=', true]]],
            context: this.options.recordInfo.context,
        }).then((data) => {
            // Create the buttons for the mailing list we-select
            return Object.keys(data).map(key => {
                const record = data[key];
                const button = document.createElement('we-button');
                button.dataset.selectMailingList = record[0];
                button.textContent = record[1];
                return button;
            });
        });
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
    moveBlock: function (previewMode, widgetValue, params) {
        const $container = $(widgetValue === 'moveToFooter' ? 'footer' : 'main');
        this.$target.closest('.o_newsletter_popup').prependTo($container.find('.oe_structure:o_editable').first());
    },
    setBackdrop(previewMode, widgetValue, params) {
        const color = widgetValue ? 'var(--black-50)' : '';
        this.$target[0].style.setProperty('background-color', color, 'important');
    },
    /**
     * @override
     */
    destroy: function () {
        this.$target.off('.newsletter_popup_option');
        this._super.apply(this, arguments);
    },
    _computeWidgetState: function (methodName, params) {
        debugger;
        switch (methodName) {
            case 'moveBlock':
                return this.$target.closest('footer').length ? 'moveToFooter' : 'moveToBody';
            case 'select_mailing_list':
                return this._getMailingListID()

        }
        return this._super(...arguments);
    },
    _getMailingListID: function () {
        debugger;
        let listID = parseInt(this.$target.attr('data-list-id'));
        if (!listID && this.mailingLists.length) {
            listID = this.mailingLists[0].dataset.selectMailingList;
        }
        return listID;
    },

    //--------------------------------------------------------------------------
    // Options
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    select_mailing_list: function () {
        debugger;
        var self = this;
        return this._super.apply(this, arguments).then(function () {
            self.$target.data('quick-open', true);
            self.$target.removeData('content');
            return self._refreshPublicWidgets();
        });
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
});
