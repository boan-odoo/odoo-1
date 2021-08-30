/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            auto-load more messages from channel on scroll
        [Test/model]
            DiscussComponent
        [Test/assertions]
            3
        [Test/scenario]
            {Dev/comment}
                AKU TODO: thread specific test
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [0]
                    [Record/traits]
                        mail.channel
                    [mail.channel/id]
                        20
                {foreach}
                    {Record/insert}
                        [Record/traits]
                            Range
                        [start]
                            0
                        [end]
                            40
                .{as}
                    i
                .{do}
                    {entry}
                        [Record/traits]
                            mail.message
                        [mail.message/body]
                            not empty
                        [mail.message/model]
                            mail.channel
                        [mail.message/res_id]
                            20
            @testEnv
            .{UI/waitUntilEvent}
                [eventName]
                    o-component-message-list-scrolled
                [message]
                    should wait until channel 20 scrolled to its last message initially
                [predicate]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            scrollTop
                            thread
                        [Function/out]
                            @thread
                            .{Thread/model}
                            .{=}
                                mail.channel
                            .{&}
                                @thread
                                .{Thread/id}
                                .{=}
                                    20
                            .{&}
                                @scrollTop
                                .{=}
                                    @thread
                                    .{Thread/threadViews}
                                    .{Collection/first}
                                    .{ThreadView/messageListComponents}
                                    .{Collection/first}
                                    .{web.Element/scrollHeight}
                                    .{-}
                                        @thread
                                        .{Thread/threadViews}
                                        .{Collection/first}
                                        .{ThreadView/messageListComponents}
                                        .{Collection/first}
                                        .{web.Element/clientHeight}
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            @testEnv
            .{Record/insert}
                [Record/traits]
                    DiscussComponent
            @testEnv
            .{Thread/open}
                @testEnv
                .{Record/findById}
                    [Thread/id]
                        20
                    [Thread/model]
                        mail.channel
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/length}
                    .{=}
                        30
                []
                    should have 30 messages

            @testEnv
            .{UI/afterEvent}
                [eventName]
                    o-thread-view-hint-processed
                [func]
                    @testEnv
                    .{Record/update}
                        [0]
                            @testEnv
                            .{Discuss/thread}
                            .{Thread/threadViews}
                            .{Collection/first}
                            .{ThreadView/messageListComponents}
                            .{Collection/first}
                        [1]
                            [web.Element/scrollTop]
                                0
                [message]
                    should wait until channel 20 loaded more messages after scrolling to top
                [predicate]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            hint
                            threadViewer
                        [Function/out]
                            @hint
                            .{Hint/type}
                            .{=}
                                more-messages-loaded
                            .{&}
                                @threadViewer
                                .{ThreadViewer/thread}
                                .{Thread/model}
                                .{=}
                                    mail.channel
                            .{&}
                                @threadViewer
                                .{ThreadViewer/thread}
                                .{Thread/id}
                                .{=}
                                    20
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/length}
                    .{=}
                        40
                []
                    should have 40 messages
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/threadViews}
                    .{Collection/first}
                    .{ThreadView/messageListComponents}
                    .{Collection/first}
                    .{MessageListComponent/loadMore}
                    .{isFalsy}
                []
                    should not longer have load more link (all messages loaded)
`;
