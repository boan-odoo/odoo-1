/** @odoo-module **/

import { registerMessagingComponent } from '@mail/utils/messaging_component';
import { LegacyComponent } from "@web/legacy/legacy_component";

const { Component } = owl;

export class NotificationAlert extends LegacyComponent {

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @returns {boolean}
     */
    get isNotificationBlocked() {
        if (!this.messaging) {
            return false;
        }
        const windowNotification = this.messaging.browser.Notification;
        return (
            windowNotification &&
            windowNotification.permission !== "granted" &&
            !this.messaging.isNotificationPermissionDefault
        );
    }

}

Object.assign(NotificationAlert, {
    props: {},
    template: 'mail.NotificationAlert',
});

registerMessagingComponent(NotificationAlert);
