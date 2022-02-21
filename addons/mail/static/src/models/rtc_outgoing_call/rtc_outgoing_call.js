/** @odoo-module **/

import { registerModel } from '@mail/model/model_core';
import { attr, one } from '@mail/model/model_field';

registerModel({
    name: 'RtcOutgoingCall',
    identifyingFields: ['token'],
    fields: {
        rtc: one('Rtc', {
            inverse: 'rtcOutgoingCalls',
        }),
        token: attr({
            required: true,
            readonly: true,
        }),
    },
});
