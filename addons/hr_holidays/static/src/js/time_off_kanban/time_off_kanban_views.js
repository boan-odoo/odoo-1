/** @odoo-module **/

import KanbanView from "web.KanbanView";
import viewRegistry from 'web.view_registry';

export const TimeOffKanbanView = KanbanView.extend({
    mobile_friendly: false,
});

viewRegistry.add('time_off_kanban', TimeOffKanbanView);
