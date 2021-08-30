/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            does not crash when an attachment is removed before its upload starts
        [Test/model]
            ComposerViewComponent
        [Test/isTechnical]
            true
        [Test/assertions]
            1
        [Test/scenario]
            {Dev/comment}
                Uploading multiple files uploads attachments one at a time, this test
                ensures that there is no crash when an attachment is destroyed before
                its upload started.
                Promise to block attachment uploading
            :uploadPromise
                {Record/insert}
                    [Record/traits]
                        Deferred
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [Record/traits]
                    mail.channel
                [mail.channel/id]
                    20
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
                [Server/mockFetch]
                    {Record/insert}
                        [Record/traits]
                            Function
                        [Function/in]
                            resource
                        [Function/out]
                            {if}
                                @resource
                                .{=}
                                    /mail/attachment/upload
                            .{then}
                                {Promise/await}
                                    @uploadPromise
                            @original
            :thread
                @testEnv
                .{Record/findById}
                    [Thread/id]
                        20
                    [Thread/model]
                        mail.channel
            :composerComponent
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        ComposerViewComponent
                    [ComposerViewComponent/composer]
                        @thread
                        .{Thread/composer}
            :file1
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        web.File
                    [web.File/name]
                        text1.txt
                    [web.File/content]
                        hello, world
                    [web.File/contentType]
                        text/plain
            :file2
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        web.File
                    [web.File/name]
                        text2.txt
                    [web.File/content]
                        hello, world
                    [web.File/contentType]
                        text/plain
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/inputFiles}
                    [0]
                        @composerComponent
                        .{ComposerViewComponent/composerView}
                        .{ComposerView/fileUploader}
                        .{FileUploader/fileInput}
                    [1]
                        @file1
                        @file2
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @thread
                    .{Thread/composer}
                    .{Composer/attachments}
                    .{Collection/second}
                    .{Attachment/attachmentCards}
                    .{Collection/first}
                    .{AttachmentCard/attachmentCardComponents}
                    .{Collection/first}
                    .{AttachmentCardComponent/asideItemUnlink}
            {Dev/comment}
                Simulates the completion of the upload of the first attachment
            {Promise/resolve}
                @uploadPromise
            {Test/assert}
                []
                    @thread
                    .{Thread/composer}
                    .{Composer/attachments}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should only have the first attachment after cancelling the second attachment
`;
