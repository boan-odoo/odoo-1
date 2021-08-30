/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Context
        [Context/name]
            reaction
        [Context/model]
            MessageViewComponent
        [Model/fields]
            messageReactionGroup
        [Model/template]
            reactionForeach
                reaction
`;
