/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determines whether 'this' should display a message list.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasMessageList
        [Field/model]
            Chatter
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            true
`;
