/** @odoo-module **/

import { ErrorHandler, NotUpdatable } from "../utils/components";

const { Component, xml } = owl;

export class DialogContainer extends Component {
    setup() {
        this.props.bus.addEventListener("UPDATE", this.render.bind(this));
    }

    close(id) {
        if (this.props.dialogs[id]) {
            this.props.dialogs[id].props.close();
        }
    }

    handleError(error, dialogId) {
        this.close(dialogId);
        Promise.resolve().then(() => {
            throw error;
        });
    }
}
DialogContainer.components = { ErrorHandler, NotUpdatable };
DialogContainer.template = xml`
    <div class="o_dialog_container" t-att-class="{'modal-open': Object.keys(props.dialogs).length > 0}">
        <t t-foreach="Object.values(props.dialogs)" t-as="dialog" t-key="dialog.id">
            <NotUpdatable>
                <ErrorHandler onError="(error) => this.handleError(error, dialog.id)">
                    <t t-component="dialog.class" t-props="dialog.props"/>
                    <!-- NXOWL 
                        t-on-dialog-closed="dialog.props.close()" 
                        t-att-class="{o_inactive_modal: !dialog_last}"/>
                        t-att-class="{o_inactive_modal: !dialog_last}" -->
                </ErrorHandler>
            </NotUpdatable>
        </t>
    </div>
`;
// t-on-dialog-closed="dialog.props.close()" NXOWL
