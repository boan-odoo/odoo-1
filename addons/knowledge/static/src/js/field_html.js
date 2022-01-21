/** @odoo-module */

import FieldHtml from 'web_editor.field.html';
import {ToolbarsManager} from './knowledge_toolbars';
import core from "web.core";

FieldHtml.include({
    /**
     * super._render may or may not return a promise depending on the mode and the nodeOptions.
     * If the knowledge_commands is set as an option in the view, we always want to return
     * the promise to render the ToolbarsManager Widget inside the field, since those commands (for
     * the OdooEditor) indroduce usage of custom toolbars (which are active in edit and readonly mode)
     *
     * @private
     * @override
     * @returns {Promise|undefined}
     */
    _render: function () {
        const prom = this._super.apply(this, arguments);
        if (this.nodeOptions.knowledge_commands) {
            if (prom) {
                return prom.then(function () {
                    return this._addToolbarsManager();
                }.bind(this));
            } else {
                return this._addToolbarsManager();
            }
        }
        return prom;
    },
    /**
     * Appends the ToolbarsManager widget to the field, and setup the observer and event listener to handle
     * interactions with it.
     *
     * @private
     * @returns {Promise}
     */
    _addToolbarsManager: function () {
        const toolbarsManager = new ToolbarsManager(this, this.mode);
        this.$el.on('refresh_knowledge_toolbars', toolbarsManager.onUpdateToolbars.bind(toolbarsManager));
        return toolbarsManager.appendTo(this.el).then(function (el) {
            // in this scope, "this" is toolbarsManager
            this.setupEditableObserver(el); // TODO send editable directly instead of element -> this.wysiwyg.odooEditor.$editable ?
            return this.updateToolbars(el);
        }.bind(toolbarsManager, this.el));
    },
    /**
     * A Toolbar may need to be reconstructed, i.e.: when the user delete then undelete a knowledge_commands block
     *
     * @private
     * @override
     */
    _onLoadWysiwyg: function () {
        this._super.apply(this, arguments);
        if (this.nodeOptions.knowledge_commands) {
            this.wysiwyg.odooEditor.addEventListener('historyUndo', () => this.$el.trigger('refresh_knowledge_toolbars'));
            this.wysiwyg.odooEditor.addEventListener('historyRedo', () => this.$el.trigger('refresh_knowledge_toolbars'));
        }
    },
});
