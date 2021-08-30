/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Returns channel commands that match the given search term.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            ChannelCommand/searchSuggestions
        [Action/params]
            searchTerm
            [thread]
                [description]
                    prioritize and/or restrict result in the context of given
                    thread
        [Action/behavior]
            {if}
                @thread
                .{Thread/model}
                .{!=}
                    mail.channel
            .{then}
                {Dev/comment}
                    channel commands are channel specific
                {Record/insert}
                    [Record/traits]
                        Collection
                    {Record/insert}
                        [Record/traits]
                            Collection
                {break}
            {Record/insert}
                [Record/traits]
                    Collection
                [0]
                    {Env/commands}
                    .{Collection/filter}
                        {Record/insert}
                            [Record/traits]
                                Function
                            [Function/in]
                                item
                            [Function/out]
                                {if}
                                    {Utils/cleanSearchTerm}
                                        @item
                                        .{ChannelCommand/name}
                                    .{String/includes}
                                        {Utils/cleanSearchTerm}
                                            @searchTerm
                                    .{isFalsy}
                                .{then}
                                    false
                                .{elif}
                                    @command
                                    .{ChannelCommand/channelTypes}
                                .{then}
                                        @command
                                        .{ChannelCommand/channelTypes}
                                        .{Collection/includes}
                                            @thread
                                            .{Thread/channelType}
                                .{else}
                                    true
                [1]
`;
