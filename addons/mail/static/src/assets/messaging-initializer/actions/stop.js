/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            MessagingInitializer/stop
        [Action/params]
            messagingInitializer
                [type]
                    MessagingInitializer
        [Action/behavior]
            {Device/stop}
`;
