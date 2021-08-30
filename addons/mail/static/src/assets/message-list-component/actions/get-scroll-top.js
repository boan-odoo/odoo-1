/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessageListComponent/getScrollTop
        [Action/params]
            record
                [type]
                    MessageListComponent
        [Action/returns]
            Integer
        [Action/behavior]
            {MessageListComponent/_getScrollableElement}
                @record
            .{web.Element/scrollTop}
`;
