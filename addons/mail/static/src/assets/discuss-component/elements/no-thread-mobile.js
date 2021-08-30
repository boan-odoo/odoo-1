/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            noThreadMobile
        [Element/model]
            DiscussComponent
        [Record/traits]
            DiscussComponent/noThread
        [Element/isPresent]
            {Device/isMobile}
            .{&}
                {Discuss/thread}
                .{isFalsy}
            .{&}
                {Discuss/activeMobileNavbarTabId}
                .{=}
                    mailbox
        [web.Element/textContent]
            {Locale/text}
                No conversation selected.
`;
