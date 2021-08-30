/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            activityMarkDonePopoverView
        [Field/model]
            ActivityView
        [Field/type]
            one
        [Field/target]
            ActivityMarkDonePopoverView
        [Field/isCausal]
            true
        [Field/inverse]
            ActivityMarkDonePopoverView/activityViewOwner
        [Field/default]
            {Record/insert}
                [Record/traits]
                    ActivityMarkDonePopoverView
`;
