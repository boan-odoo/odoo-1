/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            view attachments
        [Test/model]
            AttachmentBoxComponent
        [Test/assertions]
            7
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                []
                    [Record/traits]
                        res.partner
                    [res.partner/id]
                        100
                []
                    [Record/traits]
                        ir.attachment
                    [ir.attachment/id]
                        143
                    [ir.attachment/mimetype]
                        text/plain
                    [ir.attachment/name]
                        Blah.txt
                    [ir.attachment/res_id]
                        100
                    [ir.attachment/res_model]
                        res.partner
                []
                    [Record/traits]
                        ir.attachment
                    [ir.attachment/id]
                        144
                    [ir.attachment/mimetype]
                        text/plain
                    [ir.attachment/name]
                        Blu.txt
                    [ir.attachment/res_id]
                        100
                    [ir.attachment/res_model]
                        res.partner
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
                    DialogManagerComponent
            @testEnv
            .{Record/insert}
                [Record/traits]
                    ChatterContainerComponent
                [ChatterContainerComponent/isAttachmentBoxVisibleInitially]
                    true
                [ChatterContainerComponent/threadId]
                    100
                [ChatterContainerComponent/threadModel]
                    res.partner
            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{Record/findById}
                        [Attachment/id]
                            143
                    .{Attachment/attachmentCards}
                    .{Collection/first}
                    .{AttachmentCard/attachmentCardComponents}
                    .{Collection/first}
                    .{AttachmentCardComponent/image}
            {Test/assert}
                []
                    @testEnv
                    .{DialogManager/dialogManagerComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    a dialog should have been opened once attachment image is clicked
            {Test/assert}
                []
                    @testEnv
                    .{AttachmentViewer/attachmentViewerComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    an attachment viewer should have been opened once attachment image is clicked
            {Test/assert}
                []
                    @testEnv
                    .{AttachmentViewer/attachmentViewerComponents}
                    .{Collection/first}
                    .{AttachmentViewerComponent/name}
                    .{web.Element/textContent}
                    .{=}
                        Blah.txt
                []
                    attachment viewer iframe should point to clicked attachment
            {Test/assert}
                []
                    @testEnv
                    .{AttachmentViewer/attachmentViewerComponents}
                    .{Collection/first}
                    .{AttachmentViewerComponent/buttonNavigationNext}
                []
                    attachment viewer should allow to see next attachment

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{AttachmentViewer/attachmentViewerComponents}
                    .{Collection/first}
                    .{AttachmentViewerComponent/buttonNavigationNext}
            {Test/assert}
                []
                    @testEnv
                    .{AttachmentViewer/attachmentViewerComponents}
                    .{Collection/first}
                    .{AttachmentViewerComponent/name}
                    .{web.Element/textContent}
                    .{=}
                        Blu.txt
                []
                    attachment viewer iframe should point to next attachment of attachment box
            {Test/assert}
                []
                    @testEnv
                    .{AttachmentViewer/attachmentViewerComponents}
                    .{Collection/first}
                    .{AttachmentViewerComponent/buttonNavigationNext}
                []
                    attachment viewer should allow to see next attachment

            @testEnv
            .{Component/afterNextRender}
                @testEnv
                .{UI/click}
                    @testEnv
                    .{AttachmentViewer/attachmentViewerComponents}
                    .{Collection/first}
                    .{AttachmentViewerComponent/buttonNavigationNext}
            {Test/assert}
                []
                    @testEnv
                    .{AttachmentViewer/attachmentViewerComponents}
                    .{Collection/first}
                    .{AttachmentViewerComponent/name}
                    .{=}
                        Blah.txt
                []
                    attachment viewer iframe should point anew to first attachment
`;
