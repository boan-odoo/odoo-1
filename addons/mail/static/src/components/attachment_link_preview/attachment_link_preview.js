/** @odoo-module **/

import { useComponentToModel } from '@mail/component_hooks/use_component_to_model/use_component_to_model';
import { registerMessagingComponent } from '@mail/utils/messaging_component';

const { Component } = owl;

class AttachmentLinkPreview extends Component {

    setup() {
        super.setup();
        useComponentToModel({ fieldName: 'component', modelName: 'AttachmentLinkPreviewView' });
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @returns {AttachmentLinkPreviewView}
     */
    get attachmentLinkPreviewView() {
        return this.messaging && this.messaging.models['AttachmentLinkPreviewView'].get(this.props.localId);
    }

}

Object.assign(AttachmentLinkPreview, {
    props: { localId: String },
    template: 'mail.AttachmentLinkPreview',
});

registerMessagingComponent(AttachmentLinkPreview);
