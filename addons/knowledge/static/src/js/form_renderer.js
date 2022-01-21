/** @odoo-module **/

import FormRenderer from 'web.FormRenderer';
import core from "web.core";

FormRenderer.include({
    /**
     * If the view is rendered as a result of the knowledgeAction => see knowledge_toolbars,
     * setup a trigger to execute that action when the rendering is done and the view loaded in the dom
     *
     * @private
     * @override
     * @returns {Promise}
     */
    _renderView: async function () {
        const prom = await this._super(...arguments);
        let knowledgeAction = this.call('knowledgeService', 'getAction', this.state.context.knowledgeActionId);
        if (knowledgeAction && knowledgeAction._status == 'pending') {
            switch (knowledgeAction.action) {
                case 'use_as_description':
                    // TODO
                    // not a great way to handle use_as_description, waiting for a wysiwyg event would be preferable (but they seem broken for now)
                    // task-ID: 2760436
                    // related events: 'contentChanged', 'content_changed' and 'wysiwyg_change'
                    core.bus.once("DOM_updated", this, this._onWysiwygRenderedAddAsDescription);
                    break;
                case 'send_as_message':
                    this.on('o_chatter_rendered', this, this._onChatterRenderedSendAsMessage);
                    break;
            }
        }
        return prom;
    },
    /**
     * If the view is rendered as a result of the knowledgeAction "add_as_description" => see knowledge_toolbars,
     *
     * When the field is loaded in the dom, execute the fake paste event.
     *
     * @private
     */
    _onWysiwygRenderedAddAsDescription: function () {
        let knowledgeAction = this.call('knowledgeService', 'getAction', this.state.context.knowledgeActionId);
        if (knowledgeAction && knowledgeAction._status == 'pending') {
            const relatedField = this.el.querySelector(`[name="${knowledgeAction.linkedRecord.fieldName}"]`); // TODO try to access the widget instead
            const params = {
                actionId: knowledgeAction.actionId,
                searchElement: relatedField,
                dataTransfer: knowledgeAction.dataTransfer,
                findEditable: searchElement => {
                    return searchElement.querySelector('.odoo-editor-editable'); // TODO use the widget and its $editable instead
                },
            };
            if (!this._knowledgePasteTemplate(params)) {
                // TODO we don't need the observer if we have a proper event triggering when the field editable is ready and in the dom
                const observer = new MutationObserver(this._knowledgePasteTemplate.bind(this, params));
                params.observer = observer;
                observer.observe(relatedField, {
                    childList: true,
                    attributes: true,
                    subtree: true,
                });
            }
        }
    },
    /**
     * If the view is rendered as a result of the knowledgeAction "send_as_message" => see knowledge_toolbars,
     *
     * On first call, open the composerView, triggering the second call
     * On second call, open the fullComposer dialog (from the opened composerView),
     * in order to send a formatted message (with the OdooEditor)
     *
     * @private
     */
    _onChatterRenderedSendAsMessage: function () {
        let knowledgeAction = this.call('knowledgeService', 'getAction', this.state.context.knowledgeActionId);
        if (knowledgeAction && knowledgeAction._status == 'pending') {
            const chatter = this._chatterContainerComponent.__owl__.bdom.child.component.chatter; // TODO need a better way to access the chatter instance, why not as data of the event?
            if (!chatter.composerView) {
                chatter.showSendMessage();
            } else {
                const actionId = knowledgeAction.actionId;
                const linkedRecord = knowledgeAction.linkedRecord;
                const dataTransfer = knowledgeAction.dataTransfer;
                this._setupKnowledgeSendAsMessageTrigger(knowledgeAction.actionId, knowledgeAction.dataTransfer);
                chatter.composerView.openFullComposer();
                this.call('knowledgeService', 'handleAction', actionId);
            }
        }
    },
    /**
     * Setup the trigger for the knowledgeAction "send_as_message" when the fullComposer dialog is ready to be used in the dom
     *
     * @private
     * @param {string} actionId id of a knowledgeAction
     * @param {Object} dataTransfer data coming from knowledge destined to be used in a faked clipboard paste event
     */
    _setupKnowledgeSendAsMessageTrigger: function (actionId, dataTransfer) {
        // TODO need to setup an event when the dialog is ready and inserted in the dom, for proper access/manipulation
        const body = this.el.ownerDocument.body; // TODO can the body change during this action ? to investigate -> maybe there is a better way to catch the dialog
        const params = {
            actionId: actionId,
            searchElement: body,
            dataTransfer: dataTransfer,
            findEditable: searchElement => {
                const dialogContainer = searchElement.querySelector('.o_dialog_container'); // TODO can contain multiple dialogs ?
                if (!dialogContainer) {
                    return null;
                }
                const sendMail = dialogContainer.querySelector('.o_mail_send'); // TODO can be multiple ?
                const editable = dialogContainer.querySelector('.odoo-editor-editable');
                if (!sendMail || !editable) {
                    return null;
                }
                return editable;
            },
        };
        const observer = new MutationObserver(this._knowledgePasteTemplate.bind(this, params));
        params.observer = observer;
        observer.observe(body, {
            childList: true,
            attributes: true,
            subtree: true,
        });
    },
    /**
     * Execute the knowledgeAction corresponding to [actionId] which consists in:
     * Trigger a fake clipboard paste event (clipboardData = [dataTransfer]),
     * in an editable found in [searchElement] using the function [findEditable].
     *
     * If the action was triggered with the use of an observer, it is disconnected if the action is able to be
     * performed (-> if the desired editable is found)
     *
     * @private
     * @param {Object} params
     * @param {string} [actionId] id of a knowledgeAction
     * @param {Element} [searchElement] dom element which should contain an editable section
     * @param {Object} [dataTransfer] data coming from knowledge destined to be used in a faked clipboard paste event
     * @param {function (Element)} [findEditable] function to find the correct editable section
     * @param {MutationObserver} [observer] observer used to trigger this function
     * @returns {boolean} whether editable was found or not
     */
    _knowledgePasteTemplate: function ({actionId, searchElement, dataTransfer, findEditable, observer=null}) {
        const editable = findEditable(searchElement); // TODO access the editable via the widget instead
        if (!editable) {
            return false;
        }
        if (observer) {
            observer.disconnect();
        }
        try {
            // create fake paste event
            const fakePaste = new Event('paste', {
                bubbles: true,
                cancelable: true,
                composed: true,
            });
            fakePaste.clipboardData = dataTransfer;

            // select the related field -> should use setCursorStart, but because of lazy loading, we cannot have an odooEditor dependance
            // TODO should trigger a wysiwyg event instead of doing this here
            const sel = document.getSelection();
            sel.removeAllRanges();
            const range = document.createRange();
            const firstChild = editable.firstChild;
            if (!firstChild) {
                range.setStart(editable);
                range.setEnd(editable);
            } else {
                range.setStartBefore(firstChild);
                range.setEndBefore(firstChild);
            }
            sel.addRange(range);

            // dispatch the fake paste event and remove the pending knowledge action
            editable.dispatchEvent(fakePaste);
            this.call('knowledgeService', 'completeAction', actionId);
        } catch (error) {
            // error during fake pasting, maybe prompt user ?
            this.call('knowledgeService', 'failAction', actionId);
        }
        return true;
    },
});
