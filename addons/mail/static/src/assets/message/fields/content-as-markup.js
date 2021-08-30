/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            contentAsMarkup
        [Field/model]
            Message
        [Field/type]
            attr
        [Field/target]
            Markup
        [Field/compute]
            {Record/insert}
                [Record/traits]
                    Markup
                @record
                .{Message/prettyBody}
`;
