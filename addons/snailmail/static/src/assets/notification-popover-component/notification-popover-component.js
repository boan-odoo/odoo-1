/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        AKU TODO: properly do this based on SnailmailNotificationPopover component
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            snailmail
        [ModelAddon/model]
            NotificationPopoverComponent
`;
