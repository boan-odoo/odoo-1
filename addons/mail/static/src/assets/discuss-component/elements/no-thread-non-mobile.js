/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            noThreadNonMobile
        [Element/model]
            DiscussComponent
        [Record/traits]
            DiscussComponent/noThread
        [Element/isPresent]
            @record
            .{DiscussComponent/discussView}
            .{DiscussView/discuss}
            .{Discuss/thread}
            .{isFalsy}
        [web.Element/textContent]
            {Locale/text}
                No conversation selected.
`;
