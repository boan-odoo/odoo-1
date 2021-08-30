/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            ThreadViewTopbar/onMouseLeaveTopBarThreadName
        [Action/params]
            record
                [type]
                    ThreadViewTopbar
        [Action/behavior]
            {Record/update}
                [0]
                    @record
                [1]
                    [ThreadViewTopbar/isMouseOverThreadName]
                        false
`;
