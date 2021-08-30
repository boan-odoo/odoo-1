/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Discuss/onClickMobileNewChannelButton
        [Action/params]
            discuss
        [Action/behavior]
            {Record/update}
                [0]
                    @discuss
                [1]
                    [Discuss/isAddingChannel]
                        true
`;
