/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            post a message containing an email address followed by a mention on another line
        [Test/model]
            ThreadViewComponent
        [Test/assertions]
            1
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                []
                    [Record/traits]
                        mail.channel
                    [mail.channel/id]
                        11
                []
                    [Record/traits]
                        res.partner
                    [res.partner/email]
                        testpartner@odoo.com
                    [res.partner/id]
                        25
                    [res.partner/name]
                        TestPartner
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            :thread
                @testEnv
                .{Record/findById}
                    [Thread/id]
                        11
                    [Thread/model]
                        mail.channel
            :threadViewer
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        ThreadViewer
                    [ThreadViewer/hasThreadView]
                        true
                    [ThreadViewer/thread]
                        @thread
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ThreadViewComponent
                [ThreadViewComponent/threadView]
                    @threadViewer
                    .{ThreadViewer/threadView}
            @testEnv
            .{UI/focus}
                @threadViewer
                .{ThreadViewer/threadView}
                .{ThreadView/thread}
                .{Thread/composer}
                .{Composer/composerTextInputComponents}
                .{Collection/first}
                .{ComposerTextInputComponent/textarea}
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/insertText
                    email@odoo.com\n
            @testEnv
            .{Component/afterNextRender}
                {foreach}
                    {String/atSign}
                    T
                    e
                .{as}
                    char
                .{do}
                    @testEnv
                    .{UI/insertText}
                        @char
                    @testEnv
                    .{UI/keydown}
                        @threadViewer
                        .{ThreadViewer/threadView}
                        .{ThreadView/thread}
                        .{Thread/composer}
                        .{Composer/composerTextInputComponents}
                        .{Collection/first}
                        .{ComposerTextInputComponent/textarea}
                    @testEnv
                    .{UI/keyup}
                        @threadViewer
                        .{ThreadViewer/threadView}
                        .{ThreadView/thread}
                        .{Thread/composer}
                        .{Composer/composerTextInputComponents}
                        .{Collection/first}
                        .{ComposerTextInputComponent/textarea}
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @threadViewer
                    .{ThreadViewer/threadView}
                    .{ThreadView/thread}
                    .{Thread/composer}
                    .{Composer/composerSuggestionComponents}
                    .{Collection/first}
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @threadViewer
                    .{ThreadViewer/threadView}
                    .{ThreadView/thread}
                    .{Thread/composer}
                    .{Composer/composerViewComponents}
                    .{Collection/first}
                    .{ComposerViewComponent/buttonSend}
            {Test/assert}
                []
                    @threadViewer
                    .{ThreadViewer/threadView}
                    .{ThreadView/thread}
                    .{Thread/cache}
                    .{ThreadCache/messages}
                    .{Collection/first}
                    .{Message/messageComponents}
                    .{Collection/first}
                    .{MessageViewComponent/content}
                    .{web.Element/htmlContent}
                    .{String/includes}
                        .o_mail_redirect[data-oe-id="25"][data-oe-model="res.partner"]:contains("@TestPartner")
                []
                    Conversation should have a message that has been posted, which contains partner mention
`;
