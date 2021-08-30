/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            attachmentBox
        [Element/model]
            ChatterComponent
        [Field/target]
            AttachmentBoxComponent
        [Element/isPresent]
            @record
            .{ChatterComponent/chatter}
            .{Chatter/attachmentBoxView}
        [AttachmentBoxComponent/attachmentBoxView]
            @record
            .{ChatterComponent/chatter}
            .{Chatter/attachmentBoxView}
`;
