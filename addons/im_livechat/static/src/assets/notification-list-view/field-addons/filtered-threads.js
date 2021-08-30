/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            FieldAddon
        [FieldAddon/field]
            NotificationListView/filteredThreads
        [FieldAddon/feature]
            im_livechat
        [FieldAddon/compute]
            {if}
                @record
                .{NotificationListView/filter}
                .{=}
                    livechat
            .{then}
                {Record/all}
                    [Record/traits]
                        Thread
                    [Thread/channelType]
                        livechat
                    [Thread/isPinned]
                        true
                    [Thread/model]
                        mail.channel
            .{else}
                @original
`;
