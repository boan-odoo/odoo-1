/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            allow attachment delete on authored message
        [Test/model]
            MessageViewComponent
        [Test/assertions]
            5
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                [Record/traits]
                    Server
                [Server/data]
                    @record
                    .{Test/data}
            :message
                @testEnv
                .{Record/insert}
                    [Record/traits]
                        Message
                    [Message/attachments]
                        @testEnv
                        .{Record/insert}
                            [Record/traits]
                                Attachment
                            [Attachment/filename]
                                BLAH.jpg
                            [Attachment/id]
                                10
                            [Attachment/name]
                                BLAH
                            [Attachment/mimetype]
                                image/jpeg
                    [Message/author]
                        @testEnv
                        .{Env/currentPartner}
                    [Message/body]
                        <p>Test</p>
                    [Message/id]
                        100
            @testEnv
            .{Record/insert}
                [Record/traits]
                    MessageViewComponent
                [MessageViewComponent/message]
                    @message
            {Test/assert}
                []
                    @message
                    .{Message/attachments}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have an attachment
            {Test/assert}
                []
                    @message
                    .{Message/attachments}
                    .{Collection/first}
                    .{Attachment/attachmentImages}
                    .{Collection/first}
                    .{AttachmentImage/attachmentImageComponents}
                    .{Collection/first}
                    .{AttachmentImageComponent/asideItemUnlink}
                []
                    should have delete attachment button

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @message
                    .{Message/attachments}
                    .{Collection/first}
                    .{Attachment/attachmentImages}
                    .{Collection/first}
                    .{AttachmentImage/attachmentImageComponents}
                    .{Collection/first}
                    .{AttachmentImageComponent/asideItemUnlink}
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            AttachmentDeleteConfirmComponent
                    .{Collection/length}
                    .{=}
                        1
                []
                    An attachment delete confirmation dialog should have been opened
            {Test/assert}
                []
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            AttachmentDeleteConfirmComponent
                    .{Collection/first}
                    .{AttachmentDeleteConfirmComponent/mainText}
                    .{web.Element/textContent}
                    .{=}
                        Do you really want to delete "BLAH"?
                []
                    Confirmation dialog should contain the attachment delete confirmation text

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Record/all}
                        [Record/traits]
                            AttachmentDeleteConfirmComponent
                    .{Collection/first}
                    .{AttachmentDeleteConfirmComponent/confirmButton}
            {Test/assert}
                []
                    @message
                    .{Message/attachments}
                    .{Collection/length}
                    .{=}
                        0
                []
                    should no longer have an attachment
`;
