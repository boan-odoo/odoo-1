/** @odoo-module **/

import { Define } from '@mail/define';

export default Define`
    {Dev/comment}
        Mailbox Starred.
    {Record/insert}
        [Record/traits]
            Field
        [Field/name]
            starred
        [Field/model]
            Env
        [Field/type]
            one
        [Field/target]
            Thread
`;
