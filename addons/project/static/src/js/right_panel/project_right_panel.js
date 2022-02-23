/** @odoo-module **/

import { AddMilestone, OpenMilestone } from '@project/js/right_panel/project_utils';
import { formatFloat, formatMonetary } from "@web/fields/formatters";

const { Component, onWillStart, onWillUpdateProps, useState } = owl;

export default class ProjectRightPanel extends Component {
    setup() {
        this.context = this.props.action.context;
        this.domain = this.props.action.domain;
        this.project_id = this.context.active_id;
        this.state = useState({
            data: {
                milestones: {
                    data: []
                },
                profitability_items: {
                    costs: { data: [], total: { billed: 0.0, to_bill: 0.0 } },
                    revenues: { data: [], total: { invoiced: 0.0, to_invoice: 0.0 } },
                },
                user: {},
            }
        });

        onWillStart(() => this._loadQwebContext());
        onWillUpdateProps(() => this._loadQwebContext());
    }

    formatFloat(value) {
        return formatFloat(value, { digits: [false, 1] });
    }

    formatMonetary(value, options = {}) {
        if (value === 0) return '';
        return formatMonetary(value, {
            currencyId: this.state.data.currency_id,
            ...options,
        });
    }

    async _loadQwebContext() {
        if (!this.project_id){ // If this is called from notif, multiples updates but no specific project
            return {};
        }
        const data = await this.rpc({
            model: 'project.project',
            method: 'get_panel_data',
            args: [this.project_id],
            kwargs: {
                context: this.context
            }
        });
        this.state.data = data;
        return data;
    }

    async onProjectActionClick(event) {
        event.stopPropagation();
        let action = event.currentTarget.dataset.action;
        const additionalContext = JSON.parse(event.currentTarget.dataset.additional_context || "{}");
        if (event.currentTarget.dataset.type === "object") {
            action = await this.rpc({
                // Use the call_button method in order to have an action
                // with the correct view naming, i.e. list view is named
                // 'list' rather than 'tree'.
                route: '/web/dataset/call_button',
                params: {
                    model: 'project.project',
                    method: event.currentTarget.dataset.action,
                    args: [this.project_id],
                    kwargs: {
                        context: this.context
                    }
                }
            });
        } else if (action.includes('{')) {  // check if the action is not an object
            action = JSON.parse(action);
        }
        this._doAction(action, {
            additional_context: additionalContext
        });
    }

    _doAction(action, options) {
        this.trigger('do-action', {
            action,
            options
        });
    }
}

ProjectRightPanel.template = "project.ProjectRightPanel";
ProjectRightPanel.components = {AddMilestone, OpenMilestone};
