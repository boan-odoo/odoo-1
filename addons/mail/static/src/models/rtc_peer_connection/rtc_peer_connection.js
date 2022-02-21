/** @odoo-module **/

import { registerModel } from '@mail/model/model_core';
import { attr } from '@mail/model/model_field';

registerModel({
    name: 'RtcPeerConnection',
    identifyingFields: ['token'],
    fields: {
        peerConnection: attr({
            readonly: true,
            required: true,
        }),
        token: attr({
            readonly: true,
            required: true,
        }),
    },
});
