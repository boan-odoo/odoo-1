/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            activityView
        [Field/model]
            ActivityComponent
        [Field/type]
            one
        [Field/target]
            ActivityView
        [Field/isRequired]
            true
`;
