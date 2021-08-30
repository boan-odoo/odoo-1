/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            chatter
        [Field/model]
            ChatterContainerComponent
        [Field/type]
            one
        [Field/target]
            Chatter
        [Field/isRequired]
            true
`;
