/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            starred: unstar all
        [Test/model]
            DiscussComponent
        [Test/assertions]
            6
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                {Dev/comment}
                    messages expected to be starred
                [0]
                    [Record/traits]
                        mail.message
                    [mail.message/body]
                        not empty
                    [mail.message/starred_partner_ids]
                        @record
                        .{Test/data}
                        .{Data/currentPartnerId}
                [1]
                    [Record/traits]
                        mail.message
                    [mail.message/body]
                        not empty
                    [mail.message/starred_partner_ids]
                        @record
                        .{Test/data}
                        .{Data/currentPartnerId}
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
                        starred
                    [Thread/model]
                        mail.box
            {Test/assert}
                []
                    @testEnv
                    .{Env/starred}
                    .{Thread/discussSidebarCategoryItemComponents}
                    .{Collection/first}
                    .{DiscussSidebarCategoryItemComponent/counter}
                    .{web.Element/textContent}
                    .{=}
                        2
                []
                    starred should have counter of 2
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/length}
                    .{=}
                        2
                []
                    should have 2 messages in starred
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            ThreadViewTopbarComponent
                    .{Collection/first}
                    .{ThreadViewTopbarComponent/unstarAllButton}
                    .{web.Element/isDisabled}
                    .{isFalsy}
                []
                    should have enabled button 'Unstar all' in the top bar of starred (has messages)

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            ThreadViewTopbarComponent
                    .{Collection/first}
                    .{ThreadViewTopbarComponent/unstarAllButton}
            {Test/assert}
                []
                    @testEnv
                    .{Env/starred}
                    .{Thread/discussSidebarCategoryItemComponents}
                    .{Collection/first}
                    .{DiscussSidebarCategoryItemComponent/counter}
                    .{isFalsy}
                []
                    starred should display no counter (= 0)
            {Test/assert}
                []
                    @testEnv
                    .{Discuss/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/length}
                    .{=}
                        0
                []
                    should have no message in starred
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            ThreadViewTopbarComponent
                    .{Collection/first}
                    .{ThreadViewTopbarComponent/unstarAllButton}
                    .{web.Element/isDisabled}
                []
                    should have disabled button 'Unstar all' in the top bar of starred (no messages)
`;
