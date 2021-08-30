/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            noThreadName
        [Element/model]
            ThreadViewTopbarComponent
        [Record/traits]
            ThreadViewTopbarComponent/threadNameStyle
        [Element/isPresent]
            @record
            .{ThreadViewTopbarComponent/threadViewTopbar}
            .{threadViewTopbar/thread}
            .{isFalsy}
        [web.Element/class]
            flex-shrink-0
            px-1
            text-truncate
            lead
            font-weight-bold
        [web.Element/textContent]
            {Locale/text}
                Discuss
`;