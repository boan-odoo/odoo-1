/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            ActionAddon
        [ActionAddon/action]
            MessagingInitializer/_initResUsersSettings
        [ActionAddon/feature]
            im_livechat
        [ActionAddon/params]
            is_discuss_sidebar_category_livechat_open
                [type]
                    Boolean
        [ActionAddon/behavior]
            {Record/update}
                [0]
                    {Env/discuss}
                [1]
                    [Discuss/categoryLivechat]
                        {Record/insert}
                            [Record/traits]
                                DiscussSidebarCategory
                            [DiscussSidebarCategory/isServerOpen]
                                @is_discuss_sidebar_category_livechat_open
                            [DiscussSidebarCategory/name]
                                {Locale/text}
                                    Livechat
                            [DiscussSidebarCategory/serverStateKey]
                                is_discuss_sidebar_category_livechat_open
                            [DiscussSidebarCategory/sortComputeMethod]
                                last_action
                            [DiscussSidebarCategory/supportedChannelTypes]
                                livechat
            @original
`;
