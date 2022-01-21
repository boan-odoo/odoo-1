/** @odoo-module **/

import FormController from 'web.FormController';

FormController.include({
    /**
     * Knowledge articles can interact with some records with the help of the KnowledgeService.
     * Those records need to have a field whose name is in [knowledgeTriggerFieldNames].
     * This list is ordered and the first match [list.fieldName <-> record.fieldName] found will
     * be stored in the KnowledgeService to be accessed later by an article in Knowledge
     *
     * @override
     */
    init: function (parent, model, renderer, params) {
        this._super.apply(this, arguments);
        this.knowledgeTriggerFieldNames = [
            'description',
            'note',
            'memo',
            'comment',
        ];
        if (!params.isKnowledgeFormView) {
            this._searchKnowledgeTriggerField();
        }
    },
    /**
     * This method finds and stores informations about the field of a record that can be interacted with in Knowledge
     * Search only for form views loaded from an action that can be called again
     *
     * @private
     */
    _searchKnowledgeTriggerField: function () {
        // TODO search constraints are non deterministic, (don't always have a controlpanel, nor an action)
        const res_id = this.initialState.res_id;
        if (!res_id || !this.controlPanelProps || !this.controlPanelProps.action) { // TODO need more constraints + definite action access -> action may not be defined in controlpanelprops
            return;
        }
        let action = this.controlPanelProps.action;
        const view = this.controlPanelProps.view;
        const formFields = view.fieldsInfo.form;
        const fields = view.viewFields;
        let foundLinkedRecord = false;
        for (let fieldName of this.knowledgeTriggerFieldNames) {
            if (fieldName in formFields && fields[fieldName].type == 'html' && !formFields[fieldName].modifiers.readonly) {
                action = {
                    id: action.id,
                    name: action.name,
                    context: action.context,
                    res_model: action.res_model,
                    type: action.type,
                    views: action.views.map(view => Array.isArray(view) ? view : [false, view.type]),
                    domain: action.domain,
                };
                this.call('knowledgeService', 'setLinkedRecord', {
                    // TODO store the String display of the name of the field for the button in the template - toolbar
                    actionId: action.id,
                    action: action,
                    model: view.model,
                    res_id: res_id,
                    fieldName: fieldName,
                });
                foundLinkedRecord = true;
                break;
            }
        }
        if (!foundLinkedRecord) {
            this.call('knowledgeService', 'setLinkedRecord', null);
        }
    },
    /**
     * When the record in the form view changes, it has to be updated in the knowledgeService too
     *
     * @override
     */
    update: async function (params, options) {
        await this._super(...arguments);
        let linkedRecord = this.call('knowledgeService', 'getLinkedRecord');
        if (linkedRecord && params.action && params.action.id == linkedRecord.actionId && params.currentId != linkedRecord.res_id) {
            linkedRecord.res_id = params.currentId;
        }
    },
});
