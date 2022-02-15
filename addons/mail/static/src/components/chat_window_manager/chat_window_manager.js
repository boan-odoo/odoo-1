/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class ChatWindowManager extends LegacyComponent {}

Object.assign(ChatWindowManager, {
    props: {},
    template: 'mail.ChatWindowManager',
});

registerMessagingComponent(ChatWindowManager);
