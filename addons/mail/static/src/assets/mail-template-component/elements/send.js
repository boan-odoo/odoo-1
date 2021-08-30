/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            send
        [Element/model]
            MailTemplateComponent
        [web.Element/tag]
            button
        [Record/traits]
            MailTemplateComponent/button
        [web.Element/class]
            btn
            btn-link
        [web.Element/data-mail-template-id]
            @record
            .{MailTemplateComponent/mailTemplate}
            .{MailTemplate/id}
        [Element/onClick]
            {web.Event/stopPropagation}
                @ev
            {web.Event/preventDefault}
                @ev
            {MailTemplate/send}
                @record
                .{MailTemplateComponent/mailTemplate}
                @record
                .{MailTemplateComponent/activity}
        [web.Element/textContent]
            {Locale/text}
                Send Now
`;
