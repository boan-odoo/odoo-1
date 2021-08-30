/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            everyMinuteIntervalId
        [Field/model]
            Time
        [Field/type]
            attr
        [Field/target]
            Integer
        [Field/compute]
            {Browse/setInterval}
                [0]
                    {Time/_onEveryMinuteTimeout}
                [1]
                    60
                    .{*}
                        1000
`;
