/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            actionButtonsCompact
        [Element/model]
            ComposerViewComponent
        [Record/traits]
            ComposerViewComponent/actionButtons
        [Element/isPresent]
            @record
            .{ComposerViewComponent/isCompact}
            .{isFalsy}
`;
