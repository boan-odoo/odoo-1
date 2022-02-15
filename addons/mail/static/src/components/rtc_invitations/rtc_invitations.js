/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class RtcInvitations extends LegacyComponent {}

Object.assign(RtcInvitations, {
    props: {},
    template: 'mail.RtcInvitations',
});

registerMessagingComponent(RtcInvitations);
