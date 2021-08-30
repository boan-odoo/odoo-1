/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            mailboxInbox
        [Element/model]
            ThreadIconComponent
        [web.Element/class]
            fa
            fa-inbox
        [Element/isPresent]
            @record
            .{ThreadIconComponent/thread}
            .{&}
                @record
                .{ThreadIconComponent/thread}
                .{Thread/model}
                .{=}
                    mail.box
            .{&}
                @record
                .{ThreadIconComponent/thread}
                .{=}
                    {Env/inbox}
`;
