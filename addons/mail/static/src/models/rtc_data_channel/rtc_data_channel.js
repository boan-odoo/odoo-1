/** @odoo-module **/

import { registerModel } from '@mail/model/model_core';
import { attr } from '@mail/model/model_field';

registerModel({
    name: 'RtcDataChannel',
    identifyingFields: ['token'],
    lifecycleHooks: {
        _willDelete() {
            this.dataChannel.close();
        },
    },
    fields: {
        dataChannel: attr({
            required: true,
            readonly: true,
        }),
        token: attr({
            readonly: true,
            required: true,
        }),
    },
});
