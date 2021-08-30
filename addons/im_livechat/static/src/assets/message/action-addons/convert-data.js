/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ActionAddon
        [ActionAddon/action]
            Message/convertData
        [ActionAddon/feature]
            im_livechat
        [ActionAddon/behavior]
            :data2
                @original
            {if}
                @data
                .{Dict/hasKey}
                    author_id
            .{then}
                {if}
                    @data
                    .{Dict/get}
                        author_id
                    .{Collection/third}
                .{then}
                    {Dev/comment}
                        flux specific for livechat, a 3rd param is livechat_username
                        and means 2nd param (display_name) should be ignored
                    {Record/update}
                        [0]
                            @data2
                        [1]
                            [Message/author]
                                {Record/insert}
                                    [Record/traits]
                                        Partner
                                    [Partner/id]
                                        @data
                                        .{Dict/get}
                                            author_id
                                        .{Collection/first}
                                    [Partner/livechatUsername]
                                        @data
                                        .{Dict/get}
                                            author_id
                                        .{Collection/third}
            @data2
`;
