/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Determines whether 'this' should display followers menu.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            hasFollowers
        [Field/model]
            Chatter
        [Field/type]
            attr
        [Field/target]
            Boolean
        [Field/default]
            true
`;
