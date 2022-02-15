/** @odoo-module **/

import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class Tooltip extends LegacyComponent {}
Tooltip.template = "web.Tooltip";
Tooltip.props = {
    tooltip: { type: String, optional: true },
    template: { type: String, optional: true },
    info: { optional: true },
};
