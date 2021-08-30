/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            tab
        [Field/model]
            MobileMessagingNavbarComponent:tab
        [Field/type]
            one
        [Field/target]
            Tab
        [Field/isRequired]
            true
`;
