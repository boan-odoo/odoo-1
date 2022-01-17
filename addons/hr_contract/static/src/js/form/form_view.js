/** @odoo-module **/

import FormView from 'web.FormView';
import Renderer from './form_renderer';
import viewRegistry from 'web.view_registry';

export const hrContractForm = FormView.extend({
    config: Object.assign({}, FormView.prototype.config, {
        Renderer: Renderer,
    }),
});

viewRegistry.add('hr_contract_form', hrContractForm);
