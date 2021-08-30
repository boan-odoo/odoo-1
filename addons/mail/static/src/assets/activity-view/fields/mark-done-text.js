/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Label for mark as done. This is just for translations purpose.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            markDoneText
        [Field/model]
            ActivityView
        [Field/type]
            attr
        [Field/target]
            String
        [Field/compute]
            {Locale/text}
                Mark Done
`;
