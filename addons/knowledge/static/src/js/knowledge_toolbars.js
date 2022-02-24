/** @odoo-module **/

import core from 'web.core';
import Widget from 'web.Widget';
import Class from 'web.Class';
const _t = core._t;

/**
 * A KnowledgeToolbar is a toolbar that is inserted in a field_html, and that is destined to interact with elements in
 * the OdooEditor editable element. The toolbars are always visible and are absolutely positioned over the element they are
 * corresponding to.
 *
 * This is an abstract class that handles basic behaviors for such a Toolbar, and is destined to be extended for functional
 * purposes
 */
const KnowledgeToolbar = Widget.extend({
    /**
     * @override
     * @param {Object} parent
     * @param {Element} anchor element that can be interacted with via the toolbar
     * @param {string} template html template for the toolbar
     * @param {string} mode 'edit' or 'readonly'
     */
    init: function (parent, anchor, template, mode) {
        this._super.apply(this, [parent]);
        this.anchor = anchor;
        this.template = template;
        this.mode = mode;
        this.anchorResizeObserver = new ResizeObserver(this._anchorResizeCallback.bind(this));
    },
    /**
     * @override
     */
    start: function () {
        return this._super.apply(this, arguments).then(function () {
            this.anchorResizeObserver.observe(this.anchor);
            this._setupButtons();
        }.bind(this));
    },
    /**
     * @private
     * @param {Array} entries Array of ResizeObserverEntry to access dimensions changes
     */
    _anchorResizeCallback: function (entries) {
        for (let entry of entries) {
            if (entry.target) {
                this.repositionToolbar(entry.target); // target is the reference for the toolbar position
            }
        }
    },
    /**
     * @private
     */
    _setupButtons: function () {
        const buttons = this.el.querySelectorAll('button');
        buttons.forEach(this._setupButton.bind(this));
    },
    /**
     * @private
     */
    _removeAnchor: function () {
        this._removeToolbar();
        this.anchor.remove();
    },
    /**
     * @private
     */
    _removeToolbar: function () {
        this.trigger_up('toolbar_removed', {
            anchor: this.anchor,
            toolbar: this,
        });
        this.anchorResizeObserver.disconnect();
        this.el.remove();
    },
    /** Functions to override **/
    /**
     * Implementation of the toolbar positioning relative to a target element
     * The toolbar position is absolute so it has to be positioned manually
     *
     * @param {Element} target
     */
    repositionToolbar: function (target) {
        return;
    },
    /**
     * This function is called for each button of the toolbar. Each button should have a data-call attribute which
     * is used as key for differentiation
     *
     * Common implementation would be a switch case on "button.dataset.call"
     *
     * @param {Element} button
     */
    _setupButton: function (button) {
        return;
    },
});

/**
 * Toolbar for the /file command
 */
 const FileToolbar = KnowledgeToolbar.extend({
    xmlDependencies: ['/knowledge/static/src/xml/knowledge_toolbars.xml'],
    repositionToolbar: function (target) {
        this._super.apply(this, arguments);
    },
    _setupButton: function (button) {
        this._super.apply(this, arguments);
    },
});

/**
 * Toolbar for the /template command
 */
const TemplateToolbar = KnowledgeToolbar.extend({
    xmlDependencies: ['/knowledge/static/src/xml/knowledge_toolbars.xml'],
    /**
     * @override
     */
    init: function () {
        this._super.apply(this, arguments);
        this.linkedRecord = this.call('knowledgeService', 'getLinkedRecord');
    },
    /**
     * @override
     */
    repositionToolbar: function (target) {
        this._super.apply(this, arguments);
        if (target.offsetParent == null) {
            this._removeToolbar(); // the toolbar cannot be placed and should not exist if the target has no position reference
        } else if (this.el) {
            // this computation is for a top-right positioning (relative to the target)
            let top = target.offsetTop;
            let right = target.offsetParent.offsetWidth - target.offsetWidth - target.offsetLeft;
            if (top != parseInt(this.el.style.top)) {
                this.el.style.top = top + 'px';
            }
            if (right != parseInt(this.el.style.right)) {
                this.el.style.right = right + 'px';
            }
        }
    },
    /**
     * @override
     */
    _setupButton: function (button) {
        this._super.apply(this, arguments);
        switch (button.dataset.call) {
            /**
             * Both 'send_as_message' and 'use_as_description' buttons reload the form view of a linked record,
             * and prepend paste the content of the template as a message or the value of a field_html
             */
            case 'send_as_message':
            case 'use_as_description':
                button.addEventListener("click", function(ev) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    //CREATE DATATRANSFER FOR FAKE PASTE EVENT
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/html', this.anchor.outerHTML);

                    const knowledgeAction = {
                        action: button.dataset.call,
                        linkedRecord: this.linkedRecord,
                        dataTransfer: dataTransfer,
                    };
                    //CREATE UNIQUE UID TO REFERENCE THE PENDING KNOWLEDGE ACTION
                    const knowledgeActionId = this.call('knowledgeService', 'addAction', knowledgeAction);
                    delete this.linkedRecord.action.context.knowledgeActionId;
                    delete this.linkedRecord.action.context.mode;
                    // TODO would be better to access the service instead of storing more data in the context

                    //RENDER FORM VIEW
                    this.do_action(this.linkedRecord.action, {
                        additional_context: {
                            knowledgeActionId: knowledgeActionId,
                            mode: knowledgeAction.action == 'use_as_description' ? 'edit' : 'readonly',
                        },
                        view_type: 'form',
                        res_id: this.linkedRecord.res_id,
                        clear_breadcrumbs: true, // TODO can be used to clear breadcrumbs, but what we want is going backward instead, without wiping the history
                    });
                }.bind(this));
                break;
            case 'copy_to_clipboard':
                button.addEventListener("click", function (ev) {
                    // we don't want to switch to edit mode while clicking on this button
                    ev.stopPropagation();
                    ev.preventDefault();
                });
                const clipboard = new ClipboardJS(
                    button,
                    {target: () => this.anchor}
                );
                clipboard.on('success', (e) => {
                    this.displayNotification({
                        type: 'success',
                        message: _t("Template copied to clipboard."),
                    });
                });
                break;
            case 'trash':
                // only available in edit mode. Remove the toolbar and the linked anchor element
                button.addEventListener("click", function (ev) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    // TODO set selection after the removed element -> should use setCursorStart, but because of lazy loading, we cannot have an odooEditor dependance
                    const sel = document.getSelection();
                    sel.removeAllRanges();
                    const range = document.createRange();
                    range.setStartAfter(this.anchor);
                    range.setEndAfter(this.anchor);
                    sel.addRange(range);

                    this._removeAnchor();
                }.bind(this));
                break;
        }
    },
});

/**
 * This widget is used by a field_html to maintain knowledgeToolbars where they need to be (positioning, creation, deletion)
 */
const ToolbarsManager = Widget.extend({
    xmlDependencies: ['/knowledge/static/src/xml/knowledge_toolbars.xml'],
    custom_events: {
        toolbar_removed: '_onToolbarRemoved',
    },
    toolbar_types: {
        o_knowledge_template: {
            template: 'knowledge.template_toolbar',
            Toolbar: TemplateToolbar,
        },
        o_knowledge_file: {
            template: 'knowledge.file_toolbar',
            Toolbar: FileToolbar,
        },
    },
    /**
     * @override
     * @param {Object} parent
     * @param {string} mode 'edit' or 'readonly'
     */
    init: function (parent, mode) {
        this._super.apply(this, arguments);
        this.anchors = new Set();
        this.toolbars = new Set();
        this.mode = mode;
        this.template = 'knowledge.toolbars_manager';
        this.editableObserver = new MutationObserver(this._repositionCallback.bind(this));
        this.imgResizeObserver = new ResizeObserver(this._imgResizeCallback.bind(this));
    },
    /**
     * @private
     */
    _onToolbarRemoved: function (event) {
        event.stopPropagation();
        this.anchors.delete(event.data.anchor);
        this.toolbars.delete(event.data.toolbar);
    },
    /**
     * When a mutation occur on the editable of the field_html, KnowledgeToolbars may need to be
     * repositioned
     *
     * @private
     */
    _repositionCallback: function (mutationList, observer) {
        mutationList.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.tagName == "IMG") {
                    this.imgResizeObserver.observe(node);
                }
            }.bind(this));
        }.bind(this));
        this.repositionToolbars();
    },
    /**
     * When an image is uploaded, we have to catch it's dimension changes when the uploading is finished, and reposition the toolbars
     *
     * @private
     * @param {Array} entries Array of ResizeObserverEntry to access dimensions changes
     */
    _imgResizeCallback: function (entries) {
        for (let entry of entries) {
            if (entry.target) {
                this.repositionToolbars();
            }
        }
    },
    repositionToolbars: function () {
        this.toolbars.forEach(toolbar => {
            toolbar.repositionToolbar(toolbar.anchor);
        });
    },
    setupEditableObserver: function (element) { // TODO would be better if the editable is passed as the argument
        const editable = element.querySelector('.odoo-editor-editable');
        if (editable) {
            this.editableObserver.observe(editable, {
                childList: true,
                attributes: false,
                subtree: true,
            });
        } else {
            this.editableObserver.disconnect();
        }
    },
    /**
     * @param {Event} e
     * @param {Object} data
     * @param {Array} [toolbarsDatas] Array of objects used for the creation of Toolbars:
     */
    onUpdateToolbars: function (e, data = {}) {
        this.updateToolbars(e.currentTarget, "toolbarsData" in data ? data.toolbarsData : []);
    },
    /**
     * @param {Element} element
     * @param {Array} toolbarsData
     * @param {Element} [anchor] the element linked to the toolbar
     * @param {string} [type] html class representing the type of the anchor (i.e.: o_knowledge_template)
     * @returns {Promise} promise to append every Toolbar to this ToolbarManager
     */
    updateToolbars: function (element, toolbarsData = []) {
        if (!toolbarsData.length) {
            const types = new Set(Object.getOwnPropertyNames(this.toolbar_types));
            element.querySelectorAll('.o_knowledge_toolbar_anchor').forEach(function (types, node) {
                const type = Array.from(node.classList).find(className => types.has(className));
                if (type) {
                    toolbarsData.push({
                        anchor: node,
                        type: type,
                    });
                }
            }.bind(this, types));
        }
        const promises = [];
        toolbarsData.forEach(toolbarData => {
            if (!this.anchors.has(toolbarData.anchor)) {
                promises.push(this._createToolbar(toolbarData));
            }
        });
        return Promise.all(promises);
    },
    /**
     * @private
     * @param {Object}
     * @param {Element} [anchor] the element linked to the toolbar
     * @param {string} [type] html class representing the type of the anchor (i.e.: o_knowledge_template)
     * @returns {Promise} promise to append this Toolbar to this ToolbarManager
     */
    _createToolbar: function ({anchor, type}) {
        const {Toolbar, template} = this.toolbar_types[type];
        const toolbar = new Toolbar(this, anchor, template, this.mode);
        this.anchors.add(anchor);
        this.toolbars.add(toolbar);
        return toolbar.appendTo(this.el);
    },
});

export {
    ToolbarsManager,
    TemplateToolbar,
    FileToolbar,
    KnowledgeToolbar,
};
