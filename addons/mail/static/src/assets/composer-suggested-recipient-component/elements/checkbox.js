/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Element
        [Element/name]
            checkbox
        [Element/model]
            ComposerSuggestedRecipientComponent
        [web.Element/class]
            custom-control
            custom-checkbox
        [Element/isPresent]
            @record
            .{ComposerSuggestedRecipientComponent/suggestedRecipientInfo}
`;
