/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Open thread from init active id. 'initActiveId' is used to refer to
        a thread that we may not have full data yet, such as when messaging
        is not yet initialized.
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Discuss/openInitThread
        [Action/params]
            discuss
        [Action/behavior]
            :model
                {if}
                    @discuss
                    .{Discuss/initActiveId}
                    .{Value/isNumber}
                .{then}
                    mail.channel
                .{else}
                    @discuss
                    .{Discuss/initActiveId}
                    .{String/split}
                        _
                    .{Collection/first}
            :id
                {if}
                    @discuss
                    .{Discuss/initActiveId}
                    .{Value/isNumber}
                .{then}
                    @discuss
                    .{Discuss/initActiveId}
                .{else}
                    @discuss
                    .{Discuss/initActiveId}
                    .{String/split}
                        _
                    .{Collection/second}
            :thread
                {Record/findById}
                    [Thread/id]
                        @id
                    [Thread/model]
                        @model
            {if}
                @thread
                .{isFalsy}
            .{then}
                {break}
            {Thread/open}
                @thread
            {if}
                {Device/isMobile}
                .{&}
                    @thread
                    .{Thread/channelType}
            .{then}
                {Record/update}
                    [0]
                        @discuss
                    [1]
                        [Discuss/activeMobileNavbarTabId]
                            @thread
                            .{Thread/channelType}
`;
