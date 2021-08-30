/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            load more messages from channel
        [Test/model]
            DiscussComponent
        [Test/assertions]
            6
        [Test/scenario]
            {Dev/comment}
                AKU: thread specific test
                channel expected to be rendered, with a random unique id that
                will be referenced in the test
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
                [1]
                    {Dev/comment}
                        partner to be set as author, with a random
                        unique id that will be used to link message
                    [Record/traits]
                        res.partner
                    [res.partner/id]
                        11
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
                        [mail.message/date]
                            2019-04-20 10:00:00
                        [mail.message/model]
                            mail.channel
                        [mail.message/res_id]
                            20
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
                    .{Thread/threadViews}
                    .{Collection/first}
                    .{ThreadView/messageListComponents}
                    .{Collection/first}
                    .{MessageListComponent/separatorDate}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have a single date separator
                    {Dev/comment}
                        to check: may be client timezone dependent
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/threadViews}
                    .{Collection/first}
                    .{ThreadView/messageListComponents}
                    .{Collection/first}
                    .{MessageListComponent/separatorLabelDate}
                    .{web.Element/textContent}
                    .{=}
                        April 20, 2019
                []
                    should display date day of messages
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
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/threadViews}
                    .{Collection/first}
                    .{ThreadView/messageListComponents}
                    .{Collection/first}
                    .{MessageListComponent/loadMore}
                []
                    should have load more link

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/threadViews}
                    .{Collection/first}
                    .{ThreadView/messageListComponents}
                    .{Collection/first}
                    .{MessageListComponent/loadMore}
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
