/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            time
        [Field/model]
            Env
        [Field/type]
            one
        [Field/target]
            Time
        [Field/isCausal]
            true
        [Field/isReadonly]
            true
        [Field/isRequired]
            true
        [Field/default]
            {Record/insert}
                [Record/traits]
                    Time
`;
