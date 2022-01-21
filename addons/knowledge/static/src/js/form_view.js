/** @odoo-module **/

import FormView from 'web.FormView';

FormView.include({
    /**
     * If the action is the result of the knowledgeAction "use_as_description" => see knowledge_toolbars
     * the view should be opened in edit mode.
     *
     * @override
     */
    init: function (viewInfo, params) {
        // TODO need a real trigger for a knowledgeAction. We don't always have action in params
        if (params.action && params.action.context.knowledgeActionId) {
            params.mode = params.action.context.mode;
            delete params.action.context.mode;
        }
        this._super.apply(this, arguments);
    },
});
