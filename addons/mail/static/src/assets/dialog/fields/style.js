/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            style
        [Field/model]
            Dialog
        [Field/type]
            attr
        [Field/target]
            String
        [Field/compute]
            [web.scss/background-color]
                {scss/rgba}
                    0
                    0
                    0
                    @record
                    .{Dialog/backgroundOpacity}
`;
