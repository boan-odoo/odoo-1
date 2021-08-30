/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Test
        [Test/name]
            base non empty rendering
        [Test/model]
            AttachmentBoxComponent
        [Test/assertions]
            4
        [Test/scenario]
            :testEnv
                {Record/insert}
                    [Record/traits]
                        Env
            @testEnv
            .{Record/insert}
                []
                    [Record/traits]
                        ir.attachment
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
                    [ir.attachment/mimetype]
                        text/plain
                    [ir.attachment/name
                        Blu.txt
                    [ir.attachment/res_id]
                        100
                    [ir.attachment/res_model]
                        res.partner
                []
                    [Record/traits]
                        res.partner
                    [res.partner/id]
                        100
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
                    ChatterContainerComponent
                [ChatterContainerComponent/isAttachmentBoxVisibleInitially]
                    true
                [ChatterContainerComponent/threadId]
                    100
                [ChatterContainerComponent/threadModel]
                    res.partner
            {Test/assert}
                []
                    @thread
                    .{Thread/attachmentBoxComponents}
                    .{Collection/length}
                    .{=}
                        1
                []
                    should have an attachment box
            {Test/assert}
                []
                    @thread
                    .{Thread/attachmentBoxComponents}
                    .{Collection/first}
                    .{AttachmentBoxComponent/buttonAdd}
                []
                    should have a button add
            {Test/assert}
                []
                    @attachmentBoxComponent
                    .{AttachmentBoxComponent/attachmentBoxView}
                    .{AttachmentBoxView/fileUploader}
                []
                    should have a file uploader
            {Test/assert}
                []
                    @thread
                    .{Thread/attachmentBoxComponents}
                    .{Collection/first}
                    .{AttachmentBoxComponent/attachmentList}
                []
                    should have an attachment list
`;
