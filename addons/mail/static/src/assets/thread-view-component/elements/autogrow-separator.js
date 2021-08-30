/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            autogrowSeparator
        [Element/model]
            ThreadViewComponent
        [Record/traits]
            AutogrowComponent
        [Element/isPresent]
            @record
            .{ThreadViewComponent/threadView}
            .{ThreadView/composerView}
`;
