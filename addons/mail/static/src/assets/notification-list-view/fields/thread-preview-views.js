/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            threadPreviewViews
        [Field/model]
            NotificationListView
        [Field/type]
            many
        [Field/target]
            ThreadPreviewView
        [Field/isCausal]
            true
        [Field/inverse]
            ThreadPreviewView/notificationListViewOwner
        [Field/compute]
            @record
            .{NotificationListView/filteredThreads}
            .{Collection/sort}
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        t1
                        t2
                    [Function/out]
                        {if}
                            @t1
                            .{Thread/localMessageUnreadCounter}
                            .{>}
                                0
                            .{&}
                                @t2
                                .{Thread/localMessageUnreadCounter}
                                .{=}
                                    0
                        .{then}
                            -1
                        .{elif}
                            @t1
                            .{Thread/localMessageUnreadCounter}
                            .{=}
                                0
                            .{&}
                                @t2
                                .{Thread/localMessageUnreadCounter}
                                .{>}
                                    0
                        .{then}
                            1
                        .{elif}
                            @t1
                            .{Thread/lastMessage}
                            .{&}
                                @t2
                                .{Thread/lastMessage}
                        .{then}
                            {if}
                                @t1
                                .{Thread/lastMessage}
                                .{Message/id}
                                .{<}
                                    @t2
                                    .{Thread/lastMessage}
                                    .{Message/id}
                            .{then}
                                1
                            .{else}
                                -1
                        .{elif}
                            @t1
                            .{Thread/lastMessage}
                        .{then}
                            -1
                        .{elif}
                            @t2
                            .{Thread/lastMessage}
                        .{then}
                            1
                        .{elif}
                            @t1
                            .{Thread/id}
                            .{<}
                                @t2
                                .{Thread/id}
                        .{then}
                            -1
                        .{else}
                            1
            .{Collection/map}
                {Record/insert}
                    [Record/traits]
                        Function
                    [Function/in]
                        thread
                    [Function/out]
                        {Record/insert}
                            [Record/traits]
                                ThreadPreviewView
                            [ThreadPreviewView/thread]
                                @thread
`;
