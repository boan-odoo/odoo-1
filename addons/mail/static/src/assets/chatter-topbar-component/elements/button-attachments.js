/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            buttonAttachments
        [Element/model]
            ChatterTopbarComponent
        [web.Element/tag]
            button
        [Record/traits]
            ChatterTopbarComponent/button
        [web.Element/class]
            btn
            btn-link
        [web.Element/type]
            button
        [web.Element/isDisabled]
            @record
            .{ChatterTopbarComponent/chatter}
            .{Chatter/isDisabled}
        [Element/onClick]
            {Record/update}
                [0]
                    @record
                    .{ChatterTopbarComponent/chatter}
                [1]
                    [Chatter/attachmentBoxView]
                        {if}
                            @record
                            .{ChatterTopbarComponent/chatter}
                            .{Chatter/attachmentBoxView}
                        .{then}
                            {Record/empty}
                        .{else}
                            {Record/insert}
                                [Record/traits]
                                    AttachmentBoxView
`;
