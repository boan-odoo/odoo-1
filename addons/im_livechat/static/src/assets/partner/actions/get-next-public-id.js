/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Action
        [Action/name]
            Partner/getNextPublicId
        [Action/feature]
            im_livechat
        [Action/behavior]
            :nextPublicId
                -1
            {Record/insert}
                [Record/traits]
                    Function
                :id
                    @nextPublicId
                :nextPublicId
                    @nextPublicId
                    .{-}
                        1
                @id
`;
