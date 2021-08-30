/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onWillPatch
        [Lifecycle/model]
            MessageListComponent
        [Lifecycle/behavior]
            {Record/update}
                [0]
                    @record
                [1]
                    [MessageListComponent/_willPatchSnapshot]
                        [scrollHeight]
                            {MessageListComponent/_getScrollableElement}
                                @record
                            .{web.Element/scrollHeight}
                        [scrollTop]
                            {MessageListComponent/_getScrollableElement}
                                @record
                            .{web.Element/scrollTop}
`;
