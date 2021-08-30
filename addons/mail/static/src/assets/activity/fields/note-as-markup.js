/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            noteAsMarkup
        [Field/model]
            Activity
        [Field/type]
            attr
        [Field/type]
            Markup
        [Field/compute]
            {Record/insert}
                [Record/traits]
                    Markup
                @record
                .{Activity/note}
`;
