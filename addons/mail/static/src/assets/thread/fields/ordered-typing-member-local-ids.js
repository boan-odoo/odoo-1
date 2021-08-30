/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Technical attribute to manage ordered list of typing members.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            orderedTypingMemberLocalIds
        [Field/model]
            Thread
        [Field/type]
            attr
        [Field/target]
            Array
`;
