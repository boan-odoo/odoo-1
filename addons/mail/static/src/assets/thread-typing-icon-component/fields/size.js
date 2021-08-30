/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            size
        [Field/model]
            ThreadTypingIconComponent
        [Field/type]
            attr
        [Field/target]
            String
        [Field/validate]
            {Record/insert}
                [Record/traits]
                    Collection
                small
                medium
            .{Collection/includes}
                @field
        [Field/default]
            small
`;
