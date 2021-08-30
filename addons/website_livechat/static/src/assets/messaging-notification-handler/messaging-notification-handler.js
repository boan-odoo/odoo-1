/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            website_livechat
        [ModelAddon/model]
            MessagingNotificationHandler
        [ModelAddon/actionAddons]
            MessagingNotificationHandler/_handleNotificationPartner
`;
