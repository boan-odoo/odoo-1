/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Lifecycle
        [Lifecycle/name]
            onDelete
        [Lifecycle/model]
            Time
        [Action/behavior]
            {Browser/clearInterval}
                {Time/everyMinuteIntervalId}
`;
