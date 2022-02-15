/** @odoo-module **/

import { Popover } from "./popover";
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component, onMounted, onWillUnmount, useExternalListener, useState, xml } = owl;

class PopoverController extends LegacyComponent {
    setup() {
        this.state = useState({ displayed: false });
        this.targetObserver = new MutationObserver(this.onTargetMutate.bind(this));
        useExternalListener(window, "click", this.onClickAway, { capture: true });
        onMounted(this.onMounted);
        onWillUnmount(this.onWillUnmount);
    }
    onMounted() {
        this.targetObserver.observe(this.target.parentElement, { childList: true });
    }
    onWillUnmount() {
        this.targetObserver.disconnect();
    }

    get popoverProps() {
        return {
            close: this.props.close,
            target: this.target,
            position: this.props.position,
            popoverClass: this.props.popoverClass,
        };
    }
    get target() {
        if (typeof this.props.target === "string") {
            return document.querySelector(this.props.target);
        } else {
            return this.props.target;
        }
    }
    onClickAway(ev) {
        if (this.target.contains(ev.target) || ev.target.closest(".o_popover")) {
            return;
        }
        if (this.props.closeOnClickAway) {
            this.props.close();
        }
    }
    onTargetMutate() {
        const target = this.target;
        if (!target || !target.parentElement) {
            this.props.close();
        }
    }
}
PopoverController.components = { Popover };
PopoverController.defaultProps = {
    alwaysDisplayed: false,
    closeOnClickAway: true,
};
PopoverController.template = xml/*xml*/ `
    <Popover t-props="popoverProps">
        <t t-component="props.Component" t-props="props.props"/>
    </Popover>
`;

export class PopoverContainer extends LegacyComponent {
    setup() {
        this.props.bus.addEventListener("UPDATE", this.render.bind(this));
    }
}
PopoverContainer.components = { PopoverController };
PopoverContainer.template = xml`
    <div class="o_popover_container">
        <t t-foreach="Object.values(props.popovers)" t-as="popover" t-key="popover.id">
            <PopoverController t-props="popover" />
        </t>
    </div>
`;
