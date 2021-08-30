/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Object { token: timeoutId<Number> }
        Contains the timeoutIds of the reconnection attempts.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            _fallBackTimeouts
        [Field/model]
            Rtc
        [Field/type]
            attr
        [Field/target]
            Dict
        [Field/default]
            {Record/insert}
                [Record/traits]
                    Dict
`;
