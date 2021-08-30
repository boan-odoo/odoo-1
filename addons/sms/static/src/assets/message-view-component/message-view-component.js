/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ModelAddon
        [ModelAddon/feature]
            sms
        [ModelAddon/model]
            MessageViewComponent
        [ModelAddon/template]
            notificationFailure
                notificationIconSms
                notificationLabelSms
`;
