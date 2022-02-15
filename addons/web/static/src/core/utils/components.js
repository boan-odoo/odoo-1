/** @odoo-module **/

import { LegacyComponent } from "@web/legacy/legacy_component";
const { Component, onError, useComponent, xml } = owl;

export class NotUpdatable extends LegacyComponent {
    setup() {
        const node = useComponent().__owl__;
        node.patch = () => {};
        node.updateAndRender = () => Promise.resolve();
    }
}
NotUpdatable.template = xml`<t t-slot="default" />`;

export class ErrorHandler extends LegacyComponent {
    setup() {
        onError((error) => {
            this.props.onError(error);
        });
    }
}
ErrorHandler.template = xml`<t t-slot="default" />`;
ErrorEvent.props = ["onError"];
