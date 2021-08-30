/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Partner/startLoopFetchImStatus
        [Action/behavior]
            {Partner/_fetchImStatus}
            {Partner/_loopFetchImStatus}
`;
