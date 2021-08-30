/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingInitializer/_initCommands
        [Action/params]
            messagingInitializer
                [type]
                    MessagingInitializer
            commandsData
                [type]
                    Collection<Object>
        [Action/behavior]
            {Record/update}
                [0]
                    @env
                [1]
                    [Env/commands]
                        {Field/add}
                            @commandsData
                            .{Collection/map}
                                {Record/insert}
                                    [Record/traits]
                                        Function
                                    [Function/in]
                                        item
                                    [Function/out]
                                        {Record/insert}
                                            [Record/traits]
                                                ChannelCommand
                                            [ChannelCommand/channelTypes]
                                                @item
                                                .{Dict/get}
                                                    channel_types
                                            [ChannelCommand/help]
                                                @item
                                                .{Dict/get}
                                                    help
                                            [ChannelCommand/name]
                                                @item
                                                .{Dict/get}
                                                    name
`;
